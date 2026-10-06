const { apiResponse } = require('../utils/helpers');
const pushTokenModel = require('../models/pushTokenModel');

/**
 * Push Token Controller - devices register after sign-in and unregister on sign-out.
 */

const registerToken = async (req, res, next) => {
  try {
    await pushTokenModel.upsertToken({ userId: req.user.userId, token: req.body.token, platform: req.body.platform });
    res.json(apiResponse(true, null, 'Device registered for notifications'));
  } catch (error) {
    next(error);
  }
};

const removeToken = async (req, res, next) => {
  try {
    if (typeof req.body?.token === 'string') {
      await pushTokenModel.deleteToken({ userId: req.user.userId, token: req.body.token });
    }
    res.json(apiResponse(true, null, 'Device removed'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerToken,
  removeToken,
};
