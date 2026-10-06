const { apiResponse, parseId } = require('../utils/helpers');
const groupModel = require('../models/groupModel');
const { notify } = require('../services/notificationService');

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

    const leaderIds = await groupModel.getLeaderIds(id);
    await notify({
      userIds: leaderIds,
      title: 'New request to join',
      message: `${displayName(req.user)} asked to join ${group.name}.`,
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

    const approved = await groupModel.approveRequest(group.id, userId);
    if (!approved) {
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

module.exports = {
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
