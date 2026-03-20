const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const contactMessageModel = require('../models/contactMessageModel');

const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const submitted = await contactMessageModel.createContactMessage(name, email, subject, message);

    res.status(201).json(apiResponse(true, submitted, 'Message sent successfully'));
  } catch (error) {
    next(error);
  }
};

const getContactMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const messages = await contactMessageModel.getAllContactMessages(offset, limitNum);
    const total = await contactMessageModel.countContactMessages();

    res.json(
      apiResponse(
        true,
        messages,
        'Contact messages retrieved',
        buildPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    next(error);
  }
};

const markContactMessageRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await contactMessageModel.markContactMessageRead(id);
    if (!message) {
      return res.status(404).json(apiResponse(false, null, 'Message not found'));
    }

    res.json(apiResponse(true, message, 'Message marked as read'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
  markContactMessageRead,
};
