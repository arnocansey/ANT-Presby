const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const createMediaAsset = async ({
  fileName,
  originalName,
  mimeType,
  fileSize,
  url,
  altText = null,
  uploadedBy = null,
}) => {
  const asset = await prisma.mediaAsset.create({
    data: {
      fileName,
      originalName,
      mimeType,
      fileSize: Number(fileSize),
      url,
      altText,
      uploadedBy: uploadedBy ? Number(uploadedBy) : null,
    },
  });

  return toSnakeCaseObject(asset);
};

const getMediaAssets = async (offset = 0, limit = 24) => {
  const assets = await prisma.mediaAsset.findMany({
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  return toSnakeCaseObject(assets);
};

const countMediaAssets = async () => prisma.mediaAsset.count();

module.exports = {
  createMediaAsset,
  getMediaAssets,
  countMediaAssets,
};
