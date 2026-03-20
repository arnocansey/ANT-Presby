const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const newsModel = require('../models/newsModel');
const notificationModel = require('../models/notificationModel');
const mediaAssetModel = require('../models/mediaAssetModel');
const auditLogModel = require('../models/auditLogModel');

const shouldNotifyForPublication = (post, payload = {}) =>
  post.status === 'published' && (
    payload.status === 'published' ||
    payload.isPublished === true ||
    payload.is_published === true ||
    payload.notifySubscribers === true
  );

const getPublishedNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const items = await newsModel.getPublishedNews(offset, limitNum, search || null);
    const total = await newsModel.countPublishedNews(search || null);

    res.json(
      apiResponse(
        true,
        items,
        'News retrieved',
        buildPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    next(error);
  }
};

const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await newsModel.getNewsById(id, false);
    if (!item) {
      return res.status(404).json(apiResponse(false, null, 'News post not found'));
    }

    res.json(apiResponse(true, item, 'News post retrieved'));
  } catch (error) {
    next(error);
  }
};

const getAdminNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const filters = {
      status: status || null,
      search: search || null,
    };
    const items = await newsModel.getAdminNews(offset, limitNum, filters);
    const total = await newsModel.countAdminNews(filters);

    res.json(
      apiResponse(
        true,
        items,
        'Admin news retrieved',
        buildPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    next(error);
  }
};

const createNewsPost = async (req, res, next) => {
  try {
    const createdBy = req.user.userId;

    const post = await newsModel.createNewsPost(req.body || {}, createdBy);

    await auditLogModel.createAuditLog({
      actorUserId: createdBy,
      entityType: 'news_post',
      entityId: post.id,
      action: 'create',
      summary: `Created news post "${post.title}"`,
      metadata: {
        status: post.status,
        slug: post.slug,
      },
    });

    if (shouldNotifyForPublication(post, req.body || {})) {
      try {
        await notificationModel.createNotificationForAllUsers(
          'New announcement',
          post.title,
          'news',
          'news',
          post.id
        );
      } catch (notifyError) {
        console.warn('News notification skipped:', notifyError.message);
      }
    }

    res.status(201).json(apiResponse(true, post, 'News post created'));
  } catch (error) {
    next(error);
  }
};

const updateNewsPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const updated = await newsModel.updateNewsPost(id, updates);
    if (!updated) {
      return res.status(404).json(apiResponse(false, null, 'News post not found'));
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'news_post',
      entityId: updated.id,
      action: 'update',
      summary: `Updated news post "${updated.title}"`,
      metadata: {
        status: updated.status,
        slug: updated.slug,
      },
    });

    if (shouldNotifyForPublication(updated, updates)) {
      try {
        await notificationModel.createNotificationForAllUsers(
          'Announcement updated',
          updated.title,
          'news',
          'news',
          updated.id
        );
      } catch (notifyError) {
        console.warn('Announcement update notification skipped:', notifyError.message);
      }
    }

    res.json(apiResponse(true, updated, 'News post updated'));
  } catch (error) {
    next(error);
  }
};

const deleteNewsPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await newsModel.deleteNewsPost(id);
    if (!deleted) {
      return res.status(404).json(apiResponse(false, null, 'News post not found'));
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'news_post',
      entityId: Number(id),
      action: 'delete',
      summary: `Deleted news post #${id}`,
    });

    res.json(apiResponse(true, null, 'News post deleted'));
  } catch (error) {
    next(error);
  }
};

const uploadNewsImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No image uploaded'));
    }

    const asset = await mediaAssetModel.createMediaAsset({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/news-images/${req.file.filename}`,
      uploadedBy: req.user.userId,
    });

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'media_asset',
      entityId: asset.id,
      action: 'upload',
      summary: `Uploaded media asset "${req.file.originalname}"`,
      metadata: {
        url: asset.url,
      },
    });

    res.status(201).json(apiResponse(true, asset, 'News image uploaded'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublishedNews,
  getNewsById,
  getAdminNews,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
  uploadNewsImage,
};
