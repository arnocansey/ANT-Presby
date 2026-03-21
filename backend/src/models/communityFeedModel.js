const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  profileImageUrl: true,
  role: true,
};

const mapComment = (comment) => {
  const mapped = toSnakeCaseObject(comment);
  mapped.author = comment.author ? toSnakeCaseObject(comment.author) : null;
  return mapped;
};

const mapPost = (post, viewerUserId = null) => {
  const mapped = toSnakeCaseObject(post);
  mapped.author = post.author ? toSnakeCaseObject(post.author) : null;
  mapped.comments = (post.comments || []).map(mapComment);
  mapped.like_count = post._count?.likes || 0;
  mapped.comment_count = post._count?.comments || 0;
  mapped.liked_by_me = Boolean(
    viewerUserId && Array.isArray(post.likes) && post.likes.some((like) => like.userId === Number(viewerUserId))
  );
  delete mapped.likes;
  delete mapped._count;
  return mapped;
};

const getCommunityFeed = async (offset = 0, limit = 20, viewerUserId = null) => {
  const posts = await prisma.communityPost.findMany({
    skip: Number(offset),
    take: Number(limit),
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: authorSelect },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: authorSelect },
        },
      },
      likes: viewerUserId
        ? {
            where: { userId: Number(viewerUserId) },
            select: { id: true, userId: true },
          }
        : false,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });

  return posts.map((post) => mapPost(post, viewerUserId));
};

const countCommunityPosts = async () => prisma.communityPost.count();

const createCommunityPost = async ({ authorId, content, imageUrl = null }) => {
  const post = await prisma.communityPost.create({
    data: {
      authorId: Number(authorId),
      content,
      imageUrl,
    },
    include: {
      author: { select: authorSelect },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: authorSelect },
        },
      },
      likes: false,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });

  return mapPost(post, authorId);
};

const findCommunityPostById = async (id, viewerUserId = null) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: Number(id) },
    include: {
      author: { select: authorSelect },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: authorSelect },
        },
      },
      likes: viewerUserId
        ? {
            where: { userId: Number(viewerUserId) },
            select: { id: true, userId: true },
          }
        : false,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });

  if (!post) return undefined;
  return mapPost(post, viewerUserId);
};

const deleteCommunityPost = async (id) => {
  const deleted = await prisma.communityPost.deleteMany({
    where: { id: Number(id) },
  });

  return deleted.count > 0;
};

const createCommunityComment = async ({ postId, authorId, content }) => {
  const comment = await prisma.communityComment.create({
    data: {
      postId: Number(postId),
      authorId: Number(authorId),
      content,
    },
    include: {
      author: { select: authorSelect },
    },
  });

  return mapComment(comment);
};

const findCommunityCommentById = async (id) =>
  prisma.communityComment.findUnique({
    where: { id: Number(id) },
  });

const deleteCommunityComment = async (id) => {
  const deleted = await prisma.communityComment.deleteMany({
    where: { id: Number(id) },
  });

  return deleted.count > 0;
};

const toggleCommunityLike = async ({ postId, userId }) => {
  const existing = await prisma.communityLike.findUnique({
    where: {
      postId_userId: {
        postId: Number(postId),
        userId: Number(userId),
      },
    },
  });

  if (existing) {
    await prisma.communityLike.delete({
      where: {
        postId_userId: {
          postId: Number(postId),
          userId: Number(userId),
        },
      },
    });

    return { liked: false };
  }

  await prisma.communityLike.create({
    data: {
      postId: Number(postId),
      userId: Number(userId),
    },
  });

  return { liked: true };
};

module.exports = {
  getCommunityFeed,
  countCommunityPosts,
  createCommunityPost,
  findCommunityPostById,
  deleteCommunityPost,
  createCommunityComment,
  findCommunityCommentById,
  deleteCommunityComment,
  toggleCommunityLike,
};
