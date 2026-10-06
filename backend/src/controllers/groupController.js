const { apiResponse, parseId } = require('../utils/helpers');
const groupModel = require('../models/groupModel');
const { notify } = require('../services/notificationService');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

/**
 * Small Group Controller
 */

const GROUP_NOT_FOUND = 'Group not found';

const fail = (res, status, message) => res.status(status).json(apiResponse(false, null, message));

const isFull = (group) => group.capacity !== null && group.capacity !== undefined && group.member_count >= group.capacity;

// Admins, and active leaders of this group, may manage its join requests.
const canManageGroup = async (user, groupId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const membership = await groupModel.getMembership(groupId, user.userId);
  return Boolean(membership && membership.role === 'leader' && membership.status === 'active');
};

const displayName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A member';

// List active groups (public; signed-in viewers also get their own status)
const listGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listActiveGroups(req.user ? req.user.userId : null);
    res.json(apiResponse(true, groups, 'Groups retrieved'));
  } catch (error) {
    next(error);
  }
};

// Groups I belong to or asked to join
const listMyGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listMyGroups(req.user.userId);
    res.json(apiResponse(true, groups, 'Your groups retrieved'));
  } catch (error) {
    next(error);
  }
};

// Group details; the member list only for active members and admins
const getGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const detail = id ? await groupModel.getGroupDetail(id, req.user ? req.user.userId : null) : undefined;
    const isAdmin = req.user?.role === 'admin';

    if (!detail || (!detail.is_active && !isAdmin)) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    const canSeeMembers = isAdmin || detail.my_status === 'active';
    res.json(apiResponse(true, { ...detail, members: canSeeMembers ? detail.members : null }, 'Group retrieved'));
  } catch (error) {
    next(error);
  }
};

// Ask to join a group
const joinGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.getGroupById(id) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }
    if (!group.is_active) {
      return fail(res, 409, 'This group is not accepting members');
    }

    const existing = await groupModel.getMembership(id, req.user.userId);
    if (existing) {
      return fail(
        res,
        409,
        existing.status === 'active' ? 'You are already a member of this group' : 'Your request to join is already pending'
      );
    }

    if (isFull(group)) {
      return fail(res, 409, 'This group is full');
    }

    try {
      await groupModel.createJoinRequest(id, req.user.userId);
    } catch (error) {
      if (error?.code === 'P2002') {
        return fail(res, 409, 'Your request to join is already pending');
      }
      throw error;
    }

    // A group without a leader yet (e.g. just created) routes requests to the church admins.
    const leaderIds = await groupModel.getLeaderIds(id);
    const recipients = leaderIds.length > 0 ? leaderIds : await userModel.getActiveAdminIds();
    await notify({
      userIds: recipients,
      title: 'New request to join',
      message:
        leaderIds.length > 0
          ? `${displayName(req.user)} asked to join ${group.name}.`
          : `${displayName(req.user)} asked to join ${group.name}, which has no leader yet.`,
      type: 'group',
      entityType: 'group',
      entityId: id,
    });

    res.status(201).json(apiResponse(true, { status: 'pending' }, 'Request sent'));
  } catch (error) {
    next(error);
  }
};

// Leave a group, or cancel a pending request
const leaveGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const membership = id ? await groupModel.getMembership(id, req.user.userId) : null;

    if (!membership) {
      return fail(res, 404, 'You are not in this group');
    }

    if (membership.role === 'leader' && membership.status === 'active') {
      const leaders = await groupModel.countActiveLeaders(id);
      if (leaders <= 1) {
        return fail(res, 409, 'Make someone else leader before leaving');
      }
    }

    await groupModel.deleteMembership(id, req.user.userId);
    res.json(apiResponse(true, null, membership.status === 'active' ? 'You left the group' : 'Request cancelled'));
  } catch (error) {
    next(error);
  }
};

// Shared guard for request management: valid ids, group exists, caller is leader or admin.
const loadManagedGroup = async (req, res) => {
  const id = parseId(req.params.id);
  const group = id ? await groupModel.getGroupById(id) : undefined;

  if (!group) {
    fail(res, 404, GROUP_NOT_FOUND);
    return null;
  }
  if (!(await canManageGroup(req.user, id))) {
    fail(res, 403, 'Only this group\'s leaders can manage requests');
    return null;
  }
  return group;
};

const listRequests = async (req, res, next) => {
  try {
    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    const requests = await groupModel.listPendingRequests(group.id);
    res.json(apiResponse(true, requests, 'Join requests retrieved'));
  } catch (error) {
    next(error);
  }
};

const approveJoinRequest = async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) return fail(res, 404, 'No pending request from this member');

    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    if (isFull(group)) {
      return fail(res, 409, 'This group is full');
    }

    // Re-checked under a row lock so two simultaneous approvals cannot over-fill the group.
    const outcome = await groupModel.approveRequestWithinCapacity(group.id, userId);
    if (outcome === 'full') {
      return fail(res, 409, 'This group is full');
    }
    if (outcome !== 'approved') {
      return fail(res, 404, 'No pending request from this member');
    }

    await notify({
      userIds: [userId],
      title: 'Welcome to the group',
      message: `Your request to join ${group.name} was approved.`,
      type: 'group',
      entityType: 'group',
      entityId: group.id,
    });

    res.json(apiResponse(true, null, 'Request approved'));
  } catch (error) {
    next(error);
  }
};

const declineJoinRequest = async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) return fail(res, 404, 'No pending request from this member');

    const group = await loadManagedGroup(req, res);
    if (!group) return undefined;

    const declined = await groupModel.declineRequest(group.id, userId);
    if (!declined) {
      return fail(res, 404, 'No pending request from this member');
    }

    res.json(apiResponse(true, null, 'Request declined'));
  } catch (error) {
    next(error);
  }
};

// ---- Admin ----

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'small_group',
    entityId,
    action,
    summary,
    metadata,
  });

const pickGroupInput = (body) => ({
  name: body.name,
  description: body.description,
  meetingDay: body.meetingDay,
  meetingTime: body.meetingTime,
  location: body.location,
  capacity: body.capacity,
  ministryId: body.ministryId,
  isActive: body.isActive,
});

// Prisma errors from create/update: duplicate name, unknown ministry.
const groupWriteError = (res, error) => {
  if (error?.code === 'P2002') return fail(res, 409, 'A group with this name already exists');
  if (error?.code === 'P2003') return fail(res, 400, 'Ministry not found');
  return null;
};

const adminListGroups = async (req, res, next) => {
  try {
    const groups = await groupModel.listAllGroups();
    res.json(apiResponse(true, groups, 'Groups retrieved'));
  } catch (error) {
    next(error);
  }
};

const adminCreateGroup = async (req, res, next) => {
  try {
    const group = await groupModel.createGroup(pickGroupInput(req.body));
    await audit(req, 'create', group.id, `Created small group "${group.name}"`);
    res.status(201).json(apiResponse(true, group, 'Group created'));
  } catch (error) {
    if (!groupWriteError(res, error)) next(error);
  }
};

const adminUpdateGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.updateGroup(id, pickGroupInput(req.body)) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    await audit(req, 'update', id, `Updated small group "${group.name}"`);
    res.json(apiResponse(true, group, 'Group updated'));
  } catch (error) {
    if (!groupWriteError(res, error)) next(error);
  }
};

const adminDeactivateGroup = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const changed = id ? await groupModel.deactivateGroup(id) : 0;

    if (!changed) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    await audit(req, 'deactivate', id, `Deactivated small group #${id}`);
    res.json(apiResponse(true, null, 'Group deactivated'));
  } catch (error) {
    next(error);
  }
};

const adminSetLeaders = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const group = id ? await groupModel.getGroupById(id) : undefined;

    if (!group) {
      return fail(res, 404, GROUP_NOT_FOUND);
    }

    const userIds = req.body.userIds.map(Number);
    const users = await Promise.all(userIds.map((userId) => userModel.findUserById(userId)));
    if (users.some((user) => !user)) {
      return fail(res, 404, 'Member not found');
    }

    const updated = await groupModel.setLeaders(id, userIds);
    await audit(req, 'set_leaders', id, `Set leaders of small group "${group.name}"`, { userIds });
    res.json(apiResponse(true, updated, 'Leaders updated'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminListGroups,
  adminCreateGroup,
  adminUpdateGroup,
  adminDeactivateGroup,
  adminSetLeaders,
  canManageGroup,
  listGroups,
  listMyGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  listRequests,
  approveJoinRequest,
  declineJoinRequest,
};
