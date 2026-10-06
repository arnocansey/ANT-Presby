const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const as = (userId) => `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role: 'member' }, process.env.JWT_SECRET)}`;
const TOKEN = 'ExponentPushToken[abc123]';

describe('Push token API', () => {
  let pushTokenModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    pushTokenModel = { upsertToken: jest.fn().mockResolvedValue({ id: 1 }), deleteToken: jest.fn().mockResolvedValue(1) };
    jest.doMock('../../src/models/pushTokenModel', () => pushTokenModel);
    app = express();
    app.use(express.json());
    app.use('/api/push-tokens', require('../../src/routes/pushTokenRoutes'));
  });

  test('requires sign-in', async () => {
    const response = await request(app).post('/api/push-tokens').send({ token: TOKEN, platform: 'android' });
    expect(response.status).toBe(401);
  });

  test('registers the device for the signed-in user (moving a shared device to them)', async () => {
    const response = await request(app).post('/api/push-tokens').set('Authorization', as(7)).send({ token: TOKEN, platform: 'android' });

    expect(response.status).toBe(200);
    expect(pushTokenModel.upsertToken).toHaveBeenCalledWith({ userId: 7, token: TOKEN, platform: 'android' });
  });

  test.each([
    ['a non-Expo token', { token: 'abc', platform: 'android' }],
    ['an unknown platform', { token: TOKEN, platform: 'windows' }],
    ['a missing token', { platform: 'ios' }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await request(app).post('/api/push-tokens').set('Authorization', as(7)).send(body);

    expect(response.status).toBe(400);
    expect(pushTokenModel.upsertToken).not.toHaveBeenCalled();
  });

  test('removes only the caller\'s own token and is safe to repeat', async () => {
    pushTokenModel.deleteToken.mockResolvedValue(0);

    const response = await request(app).delete('/api/push-tokens').set('Authorization', as(7)).send({ token: TOKEN });

    expect(response.status).toBe(200);
    expect(pushTokenModel.deleteToken).toHaveBeenCalledWith({ userId: 7, token: TOKEN });
  });
});
