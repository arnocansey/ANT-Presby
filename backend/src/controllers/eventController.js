const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const eventModel = require('../models/eventModel');
const notificationModel = require('../models/notificationModel');

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
  registerForEvent,
  getUserRegistrations,
  cancelEventRegistration,
  getEventAttendees,
};
