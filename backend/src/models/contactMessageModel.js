const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

const createContactMessage = async (name, email, subject, message) => {
  const contactMessage = await prisma.contactMessage.create({
    data: {
      name,
      email,
      subject,
      message,
      isRead: false,
    },
  });

  return toSnakeCaseObject(contactMessage);
};

const getAllContactMessages = async (offset = 0, limit = 20) => {
  const messages = await prisma.contactMessage.findMany({
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  return toSnakeCaseObject(messages);
};

const countContactMessages = async () => prisma.contactMessage.count();

const markContactMessageRead = async (id) => {
  const parsedId = Number(id);
  const updated = await prisma.contactMessage.updateMany({
    where: { id: parsedId },
    data: { isRead: true },
  });

  if (updated.count === 0) {
    return undefined;
  }

  const message = await prisma.contactMessage.findUnique({
    where: { id: parsedId },
  });

  return toSnakeCaseObject(message);
};

module.exports = {
  createContactMessage,
  getAllContactMessages,
  countContactMessages,
  markContactMessageRead,
};
