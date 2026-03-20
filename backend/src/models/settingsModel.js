const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const ensureSettingsRow = async () => {
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
};

const getSettings = async () => {
  await ensureSettingsRow();
  const settings = await prisma.appSetting.findUnique({
    where: { id: 1 },
  });
  return toSnakeCaseObject(settings);
};

const updateSettings = async (settings, adminUserId) => {
  await ensureSettingsRow();

  const data = {
    updatedBy: Number(adminUserId),
  };

  if (settings.siteTitle !== undefined) data.siteTitle = settings.siteTitle;
  if (settings.contactEmail !== undefined) data.contactEmail = settings.contactEmail;
  if (settings.paymentPublicKey !== undefined) data.paymentPublicKey = settings.paymentPublicKey;
  if (settings.donationSuccessMessage !== undefined) {
    data.donationSuccessMessage = settings.donationSuccessMessage;
  }

  const updated = await prisma.appSetting.update({
    where: { id: 1 },
    data,
  });

  return toSnakeCaseObject(updated);
};

module.exports = {
  getSettings,
  updateSettings,
};
