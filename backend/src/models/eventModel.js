const prisma = require('../config/prisma');
const { toSnakeCaseObject } = require('../utils/prismaHelpers');

/**
 * Event Model - Database operations for events
 */

// Create event
const createEvent = async (name, description, eventDate, location, maxRegistrations = null) => {
  const event = await prisma.event.create({
    data: {
      name,
      description,
      eventDate: new Date(eventDate),
      location,
      maxRegistrations,
    },
  });

  return toSnakeCaseObject(event);
};

// Get all events with pagination
const getAllEvents = async (offset, limit, filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  const events = await prisma.event.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { eventDate: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      eventDate: true,
      location: true,
      maxRegistrations: true,
      status: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(events);
};

// Count events
const countEvents = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.event.count({ where });
};

// Get event by ID with registration count
const getEventById = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return undefined;
  }

  const mapped = toSnakeCaseObject(event);
  mapped.registered_count = event._count.registrations;
  delete mapped._count;
  return mapped;
};

const buildEventUpdateData = (updates) => {
  const data = {};

  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.eventDate !== undefined) data.eventDate = new Date(updates.eventDate);
  if (updates.location !== undefined) data.location = updates.location;
  if (updates.maxRegistrations !== undefined) data.maxRegistrations = updates.maxRegistrations;
  if (updates.status !== undefined) data.status = updates.status;

  return data;
};

// Update event
const updateEvent = async (eventId, updates) => {
  const id = Number(eventId);
  const data = buildEventUpdateData(updates);

  if (Object.keys(data).length === 0) {
    return getEventById(id);
  }

  const updated = await prisma.event.updateMany({
    where: { id },
    data,
  });

  if (updated.count === 0) {
    return undefined;
  }

  const event = await prisma.event.findUnique({
    where: { id },
  });

  return toSnakeCaseObject(event);
};

// Delete event
const deleteEvent = async (eventId) => {
  const id = Number(eventId);
  const deleted = await prisma.event.deleteMany({
    where: { id },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return { id };
};

// Get upcoming events
const getUpcomingEvents = async (limit = 10) => {
  const events = await prisma.event.findMany({
    where: {
      eventDate: { gt: new Date() },
      status: 'active',
    },
    take: Number(limit),
    orderBy: { eventDate: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      eventDate: true,
      location: true,
      maxRegistrations: true,
      status: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(events);
};

// Search events
const searchEvents = async (searchTerm, offset = 0, limit = 10) => {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    },
    skip: Number(offset),
    take: Number(limit),
    orderBy: { eventDate: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      eventDate: true,
      location: true,
      maxRegistrations: true,
      status: true,
      createdAt: true,
    },
  });

  return toSnakeCaseObject(events);
};

// Register user for event
const registerForEvent = async (eventId, userId) => {
  const parsedEventId = Number(eventId);
  const parsedUserId = Number(userId);

  const result = await prisma.eventRegistration.createMany({
    data: {
      eventId: parsedEventId,
      userId: parsedUserId,
    },
    skipDuplicates: true,
  });

  if (result.count === 0) {
    return undefined;
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId: parsedEventId,
        userId: parsedUserId,
      },
    },
  });

  return toSnakeCaseObject(registration);
};

// Get user registrations
const getUserRegistrations = async (userId, offset = 0, limit = 10) => {
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: Number(userId) },
    skip: Number(offset),
    take: Number(limit),
    orderBy: {
      event: {
        eventDate: 'desc',
      },
    },
    include: {
      event: true,
    },
  });

  return registrations.map((registration) => ({
    ...toSnakeCaseObject(registration.event),
    registered_at: registration.registeredAt,
  }));
};

// Cancel event registration
const cancelEventRegistration = async (eventId, userId) => {
  const parsedEventId = Number(eventId);
  const parsedUserId = Number(userId);

  const existing = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId: parsedEventId,
        userId: parsedUserId,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    return undefined;
  }

  const deleted = await prisma.eventRegistration.deleteMany({
    where: {
      eventId: parsedEventId,
      userId: parsedUserId,
    },
  });

  if (deleted.count === 0) {
    return undefined;
  }

  return existing;
};

// Get event attendees
const getEventAttendees = async (eventId, offset = 0, limit = 50) => {
  const attendees = await prisma.eventRegistration.findMany({
    where: { eventId: Number(eventId) },
    skip: Number(offset),
    take: Number(limit),
    orderBy: { registeredAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  return attendees.map((item) => ({
    ...toSnakeCaseObject(item.user),
    registered_at: item.registeredAt,
  }));
};

module.exports = {
  createEvent,
  getAllEvents,
  countEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  searchEvents,
  registerForEvent,
  getUserRegistrations,
  cancelEventRegistration,
  getEventAttendees,
};
