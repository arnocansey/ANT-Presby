const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';

jest.mock('../../src/models/userModel', () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  findUserById: jest.fn(),
  findUserByVerificationToken: jest.fn(),
  markEmailVerified: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock('../../src/utils/helpers', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
  sanitizeUser: jest.fn((user) => {
    const copy = { ...user };
    delete copy.password;
    return copy;
  }),
  apiResponse: jest.fn((success, data, message, meta = null) => ({
    success,
    data,
    message,
    ...(meta ? { meta } : {}),
  })),
}));

const authRoutes = require('../../src/routes/authRoutes');
const userModel = require('../../src/models/userModel');
const helpers = require('../../src/utils/helpers');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register requires email verification instead of logging the user in', async () => {
    userModel.findUserByEmail.mockResolvedValue(null);
    helpers.hashPassword.mockResolvedValue('hashed_password');
    userModel.createUser.mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      password: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      role: 'member',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@test.com',
        password: 'Password1',
        firstName: 'Test',
        lastName: 'User',
        phone: '+123456789',
        acceptedTerms: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      email: 'user@test.com',
      verification_required: true,
    });
    expect(response.body.message).toMatch(/check your email/i);

    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.includes('access_token='))).toBe(false);
    expect(cookies.some((cookie) => cookie.includes('refresh_token='))).toBe(false);
  });

  test('POST /api/auth/refresh fails without refresh cookie', async () => {
    const response = await request(app).post('/api/auth/refresh').send();

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
