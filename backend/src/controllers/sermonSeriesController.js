const { apiResponse, parseId } = require('../utils/helpers');
const sermonSeriesModel = require('../models/sermonSeriesModel');
const auditLogModel = require('../models/auditLogModel');
const mediaAssetModel = require('../models/mediaAssetModel');

/**
 * Sermon Series Controller
 */

const notFound = (res) => res.status(404).json(apiResponse(false, null, 'Sermon series not found'));

// List series (public)
const listSeries = async (req, res, next) => {
  try {
    const series = await sermonSeriesModel.listSeries();
    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get one series with its sermons (public)
const getSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const series = id ? await sermonSeriesModel.getSeriesWithSermons(id) : undefined;

    if (!series) {
      return notFound(res);
    }

    res.json(apiResponse(true, series, 'Sermon series retrieved'));
  } catch (error) {
    next(error);
  }
};

const DUPLICATE_TITLE = 'A series with this title already exists';
const isDuplicateTitle = (error) => error?.code === 'P2002';

const pickSeriesInput = (body) => ({
  title: body.title,
  description: body.description,
  coverImageUrl: body.coverImageUrl,
  startDate: body.startDate,
  endDate: body.endDate,
});

const audit = (req, action, entityId, summary, metadata = {}) =>
  auditLogModel.createAuditLog({
    actorUserId: req.user.userId,
    entityType: 'sermon_series',
    entityId,
    action,
    summary,
    metadata,
  });

// Create series (admin)
const createSeries = async (req, res, next) => {
  try {
    const series = await sermonSeriesModel.createSeries(pickSeriesInput(req.body));
    await audit(req, 'create', series.id, `Created sermon series "${series.title}"`);
    res.status(201).json(apiResponse(true, series, 'Sermon series created'));
  } catch (error) {
    if (isDuplicateTitle(error)) {
      return res.status(409).json(apiResponse(false, null, DUPLICATE_TITLE));
    }
    next(error);
  }
};

// Update series (admin)
const updateSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const series = id ? await sermonSeriesModel.updateSeries(id, pickSeriesInput(req.body)) : undefined;

    if (!series) {
      return notFound(res);
    }

    await audit(req, 'update', id, `Updated sermon series "${series.title}"`);
    res.json(apiResponse(true, series, 'Sermon series updated'));
  } catch (error) {
    if (isDuplicateTitle(error)) {
      return res.status(409).json(apiResponse(false, null, DUPLICATE_TITLE));
    }
    next(error);
  }
};

// Delete series (admin). Its sermons stay, without a series.
const deleteSeries = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const result = id ? await sermonSeriesModel.deleteSeries(id) : undefined;

    if (!result) {
      return notFound(res);
    }

    await audit(req, 'delete', id, `Deleted sermon series #${id}`);
    res.json(apiResponse(true, null, 'Sermon series deleted'));
  } catch (error) {
    next(error);
  }
};

// Upload a series cover image (admin)
const uploadSeriesImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No image uploaded'));
    }

    const url = `/uploads/series-images/${req.file.filename}`;
    const asset = await mediaAssetModel.createMediaAsset({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      url,
      uploadedBy: req.user.userId,
    });

    await audit(req, 'upload', asset.id, `Uploaded sermon series cover "${req.file.originalname}"`, { url });
    res.json(apiResponse(true, { url }, 'Series image uploaded'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSeries,
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  uploadSeriesImage,
};
