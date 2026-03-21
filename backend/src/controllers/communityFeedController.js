const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const communityFeedModel = require('../models/communityFeedModel');
const auditLogModel = require('../models/auditLogModel');

const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const viewerUserId = req.user?.userId || null;

    const [posts, total] = await Promise.all([
      communityFeedModel.getCommunityFeed(offset, limitNum, viewerUserId),
      communityFeedModel.countCommunityPosts(),
    ]);

    res.json(
      apiResponse(true, posts, 'Community feed retrieved', buildPaginationMeta(total, page, limit))
    );
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const content = String(req.body?.content || '').trim();
    const imageUrl = req.body?.imageUrl || req.body?.image_url || null;

    if (!content) {
      return res.status(400).json(apiResponse(false, null, 'Post content is required'));
    }

    const post = await communityFeedModel.createCommunityPost({
      authorId: req.user.userId,
      content,
      imageUrl,
    });

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'community_post',
      entityId: post.id,
      action: 'create',
      summary: 'Created a community feed post',
    });

    res.status(201).json(apiResponse(true, post, 'Post created'));
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await communityFeedModel.findCommunityPostById(req.params.id, req.user.userId);

    if (!post) {
      return res.status(404).json(apiResponse(false, null, 'Post not found'));
    }

    const canDelete = req.user.role === 'admin' || Number(post.author?.id) === Number(req.user.userId);
    if (!canDelete) {
      return res.status(403).json(apiResponse(false, null, 'You cannot delete this post'));
    }

    await communityFeedModel.deleteCommunityPost(req.params.id);

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'community_post',
      entityId: Number(req.params.id),
      action: 'delete',
      summary: 'Deleted a community feed post',
    });

    res.json(apiResponse(true, null, 'Post deleted'));
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const post = await communityFeedModel.findCommunityPostById(req.params.id, req.user.userId);
    if (!post) {
      return res.status(404).json(apiResponse(false, null, 'Post not found'));
    }

    const content = String(req.body?.content || '').trim();
    if (!content) {
      return res.status(400).json(apiResponse(false, null, 'Comment content is required'));
    }

    const comment = await communityFeedModel.createCommunityComment({
      postId: req.params.id,
      authorId: req.user.userId,
      content,
    });

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'community_comment',
      entityId: comment.id,
      action: 'create',
      summary: `Commented on community post #${req.params.id}`,
    });

    res.status(201).json(apiResponse(true, comment, 'Comment added'));
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await communityFeedModel.findCommunityCommentById(req.params.commentId);
    if (!comment) {
      return res.status(404).json(apiResponse(false, null, 'Comment not found'));
    }

    const canDelete = req.user.role === 'admin' || Number(comment.authorId) === Number(req.user.userId);
    if (!canDelete) {
      return res.status(403).json(apiResponse(false, null, 'You cannot delete this comment'));
    }

    await communityFeedModel.deleteCommunityComment(req.params.commentId);

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'community_comment',
      entityId: Number(req.params.commentId),
      action: 'delete',
      summary: `Deleted a comment from community post #${req.params.id}`,
    });

    res.json(apiResponse(true, null, 'Comment deleted'));
  } catch (error) {
    next(error);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const post = await communityFeedModel.findCommunityPostById(req.params.id, req.user.userId);
    if (!post) {
      return res.status(404).json(apiResponse(false, null, 'Post not found'));
    }

    const result = await communityFeedModel.toggleCommunityLike({
      postId: req.params.id,
      userId: req.user.userId,
    });

    res.json(apiResponse(true, result, result.liked ? 'Post liked' : 'Post unliked'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeed,
  createPost,
  deletePost,
  addComment,
  deleteComment,
  toggleLike,
};
