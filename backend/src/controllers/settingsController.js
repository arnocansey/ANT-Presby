const { apiResponse } = require('../utils/helpers');
const settingsModel = require('../models/settingsModel');
const auditLogModel = require('../models/auditLogModel');

const toClientShape = (row) => ({
  siteTitle: row.site_title,
  contactEmail: row.contact_email,
  paymentPublicKey: row.payment_public_key || '',
  donationSuccessMessage: row.donation_success_message || 'Thank you for your donation.',
  updatedAt: row.updated_at,
  createdAt: row.created_at,
});

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsModel.getSettings();
    res.json(apiResponse(true, toClientShape(settings), 'Settings retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updated = await settingsModel.updateSettings(req.body || {}, req.user.userId);
    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'app_settings',
      entityId: 1,
      action: 'update',
      summary: 'Updated application settings',
      metadata: req.body || {},
    });
    res.json(apiResponse(true, toClientShape(updated), 'Settings updated'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
