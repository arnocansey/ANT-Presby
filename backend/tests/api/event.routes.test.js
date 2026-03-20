const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

jest.mock('../../src/controllers/eventController', () => ({
  getAllEvents: (req, res) => res.json({ success: true, data: [] }),
  getUpcomingEvents: (req, res) => res.json({ success: true, data: [] }),
  getEventById: (req, res) => res.json({ success: true, data: { id: Number(req.params.id) } }),
  createEvent: (req, res) => res.status(201).json({ success: true }),
  updateEvent: (req, res) => res.json({ success: true }),
  deleteEvent: (req, res) => res.json({ success: true }),
  registerForEvent: (req, res) => res.json({ success: true, eventId: Number(req.params.id) }),
  getUserRegistrations: (req, res) => res.json({ success: true, data: [] }),
  cancelEventRegistration: (req, res) => res.json({ success: true }),
  getEventAttendees: (req, res) => res.json({ success: true, data: [] }),
}));

const eventRoutes = require('../../src/routes/eventRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/events', eventRoutes);

describe('Event API', () => {
  test('GET /api/events returns public events', async () => {
    const response = await request(app).get('/api/events');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/events/:id/register requires auth cookie', async () => {
    const response = await request(app).post('/api/events/1/register').send();
    expect(response.status).toBe(401);
  });

  test('POST /api/events/:id/register succeeds with auth cookie', async () => {
    const token = jwt.sign({ userId: 3, email: 'm@test.com', role: 'member' }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });

    const response = await request(app)
      .post('/api/events/1/register')
      .set('Cookie', [`access_token=${token}`])
      .send();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.eventId).toBe(1);
  });
});
