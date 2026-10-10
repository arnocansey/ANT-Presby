const { apiResponse, getPagination, buildPaginationMeta, parseId } = require('../utils/helpers');
const eventModel = require('../models/eventModel');
const notificationModel = require('../models/notificationModel');
const auditLogModel = require('../models/auditLogModel');
const imageStorage = require('../services/imageStorage');

/**
 * Event Controller - Handles event operations
 */

// Create event (admin only)
const createEvent = async (req, res, next) => {
  try {
    const { name, description, eventDate, location, maxRegistrations } = req.body;

    const event = await eventModel.createEvent(
      name,
      description,
      eventDate,
      location,
      maxRegistrations
    );

    try {
      await notificationModel.createNotificationForAllUsers(
        'New event announced',
        `${name} has been added to the church calendar.`,
        'event',
        'event',
        event.id
      );
    } catch (notifyError) {
      console.warn('Event notification skipped:', notifyError.message);
    }

    res.status(201).json(apiResponse(true, event, 'Event created successfully'));
  } catch (error) {
    next(error);
  }
};

// Get all events with pagination
const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const filters = {};
    if (status) filters.status = status;

    const events = await eventModel.getAllEvents(offset, limitNum, filters);
    const total = await eventModel.countEvents(filters);
    const meta = buildPaginationMeta(total, page, limit);

    res.json(apiResponse(true, events, 'Events retrieved', meta));
  } catch (error) {
    next(error);
  }
};

// Get event by ID
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await eventModel.getEventById(id);

    if (!event) {
      return res.status(404).json(apiResponse(false, null, 'Event not found'));
    }

    res.json(apiResponse(true, event, 'Event retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get upcoming events
const getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const events = await eventModel.getUpcomingEvents(parseInt(limit, 10));

    res.json(apiResponse(true, events, 'Upcoming events retrieved'));
  } catch (error) {
    next(error);
  }
};

// Update event (admin only)
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedEvent = await eventModel.updateEvent(id, updates);

    if (!updatedEvent) {
      return res.status(404).json(apiResponse(false, null, 'Event not found'));
    }

    res.json(apiResponse(true, updatedEvent, 'Event updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete event (admin only)
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await eventModel.deleteEvent(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Event not found'));
    }

    res.json(apiResponse(true, null, 'Event deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const findEventForImage = async (req, res) => {
  const id = parseId(req.params.id);
  const event = id ? await eventModel.getEventById(id) : undefined;
  if (!event) {
    res.status(404).json(apiResponse(false, null, 'Event not found'));
    return null;
  }
  return { id, event };
};

// Upload or replace an event's cover image (admin only)
const uploadEventImage = async (req, res, next) => {
  try {
    const found = await findEventForImage(req, res);
    if (!found) return undefined;

    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, 'No image uploaded'));
    }

    const { url } = await imageStorage.uploadImage(req.file, { kind: 'events', actorId: req.user.userId });
    const changed = await eventModel.setEventImage(found.id, url);
    if (!changed) {
      // The event was deleted while the image uploaded: don't leave the new image behind.
      await imageStorage.deleteImage(url);
      return res.status(404).json(apiResponse(false, null, 'Event not found'));
    }

    // Only remove the old image once the new one is saved.
    if (found.event.image_url && found.event.image_url !== url) {
      await imageStorage.deleteImage(found.event.image_url);
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'event',
      entityId: found.id,
      action: 'update_image',
      summary: `Updated the image for event "${found.event.name}"`,
      metadata: { url },
    });

    res.json(apiResponse(true, { image_url: url }, 'Event image updated'));
  } catch (error) {
    next(error);
  }
};

// Remove an event's cover image (admin only)
const removeEventImage = async (req, res, next) => {
  try {
    const found = await findEventForImage(req, res);
    if (!found) return undefined;

    await eventModel.setEventImage(found.id, null);
    if (found.event.image_url) {
      await imageStorage.deleteImage(found.event.image_url);
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'event',
      entityId: found.id,
      action: 'remove_image',
      summary: `Removed the image from event "${found.event.name}"`,
    });

    res.json(apiResponse(true, { image_url: null }, 'Event image removed'));
  } catch (error) {
    next(error);
  }
};

// Register for event
const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const event = await eventModel.getEventById(id);
    if (!event) {
      return res.status(404).json(apiResponse(false, null, 'Event not found'));
    }

    // Check if event is full
    if (event.max_registrations && event.registered_count >= event.max_registrations) {
      return res.status(400).json(apiResponse(false, null, 'Event is full'));
    }

    const registration = await eventModel.registerForEvent(id, userId);

    if (!registration) {
      return res.status(400).json(apiResponse(false, null, 'Already registered for this event'));
    }

    res.status(201).json(apiResponse(true, registration, 'Registered for event successfully'));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json(apiResponse(false, null, 'Already registered for this event'));
    }
    next(error);
  }
};

// Get user event registrations
const getUserRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const registrations = await eventModel.getUserRegistrations(userId, offset, limitNum);

    res.json(apiResponse(true, registrations, 'User registrations retrieved'));
  } catch (error) {
    next(error);
  }
};

// Cancel event registration
const cancelEventRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await eventModel.cancelEventRegistration(id, userId);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Registration not found'));
    }

    res.json(apiResponse(true, null, 'Registration cancelled successfully'));
  } catch (error) {
    next(error);
  }
};

// Get event attendees (admin only)
const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const attendees = await eventModel.getEventAttendees(id, offset, limitNum);

    res.json(apiResponse(true, attendees, 'Event attendees retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getUpcomingEvents,
  updateEvent,
  deleteEvent,
  uploadEventImage,
  removeEventImage,
  registerForEvent,
  getUserRegistrations,
  cancelEventRegistration,
  getEventAttendees,
};
