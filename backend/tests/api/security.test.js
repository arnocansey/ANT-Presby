const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
const memberToken = () => signToken({ userId: 7, email: 'donor@test.com', role: 'member' });
const adminToken = () => signToken({ userId: 1, email: 'admin@test.com', role: 'admin' });

const buildDonationModelMock = (overrides = {}) => ({
  createDonation: jest.fn().mockResolvedValue({ id: 55, status: 'pending' }),
  getDonationByReference: jest
    .fn()
    .mockResolvedValue({ id: 55, reference: 'DON-REF-1', user_id: 7, status: 'pending', amount: 150 }),
  updateDonationStatusByReference: jest.fn().mockResolvedValue({ id: 55, status: 'completed' }),
  getAllDonations: jest.fn().mockResolvedValue([]),
  countDonations: jest.fn().mockResolvedValue(0),
  getDonationById: jest
    .fn()
    .mockResolvedValue({ id: 55, user_id: 7, status: 'pending', amount: 150 }),
  getUserDonations: jest.fn().mockResolvedValue([]),
  updateDonationStatus: jest.fn().mockResolvedValue(null),
  updateDonation: jest.fn().mockResolvedValue({ id: 55 }),
  deleteDonation: jest.fn().mockResolvedValue(true),
  getDonationStatistics: jest.fn().mockResolvedValue({}),
  getDonationsByType: jest.fn().mockResolvedValue([]),
  ...overrides,
});

describe('Donation authorization', () => {
  let app;
  let donationModel;
  let paymentService;

  beforeEach(() => {
    jest.resetModules();
    donationModel = buildDonationModelMock();
    jest.doMock('../../src/models/donationModel', () => donationModel);
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));

    paymentService = jest.requireActual('../../src/services/paymentService');
    jest.doMock('../../src/services/paymentService', () => paymentService);

    const donationRoutes = require('../../src/routes/donationRoutes');
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/donations', donationRoutes);
  });

  test('a member cannot change status, amount, or reference of their own donation', async () => {
    const response = await request(app)
      .put('/api/donations/55')
      .set('Authorization', `Bearer ${memberToken()}`)
      .send({ status: 'completed', amount: 100000, reference: 'FAKE', notes: 'thanks' });

    expect(response.status).toBe(200);
    expect(donationModel.updateDonation).toHaveBeenCalledWith('55', { notes: 'thanks' });
  });

  test('an admin can still update donation status', async () => {
    const response = await request(app)
      .put('/api/donations/55')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'completed' });

    expect(response.status).toBe(200);
    expect(donationModel.updateDonation).toHaveBeenCalledWith('55', { status: 'completed' });
  });

  test('a member cannot choose the payment reference when recording a donation', async () => {
    await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${memberToken()}`)
      .send({ amount: 50, donationType: 'tithe', paymentMethod: 'card', reference: 'DON-SOMEONE-ELSE' });

    expect(donationModel.createDonation).toHaveBeenCalledWith(7, 50, 'tithe', 'card', null, undefined);
  });

  test('verification marks the donation failed when the paid amount is less than the donation', async () => {
    jest.spyOn(paymentService, 'verifyPayment').mockResolvedValue({ status: 'success', amount: 100 });

    const response = await request(app)
      .get('/api/donations/verify/DON-REF-1')
      .set('Authorization', `Bearer ${memberToken()}`);

    expect(response.status).toBe(200);
    expect(donationModel.updateDonationStatusByReference).toHaveBeenCalledWith('DON-REF-1', 'failed');
  });

  test('payment callbacks to third-party sites fall back to the frontend', async () => {
    const initSpy = jest
      .spyOn(paymentService, 'initializePayment')
      .mockResolvedValue({ authorization_url: 'http://checkout.local' });

    await request(app)
      .post('/api/donations/initialize-payment')
      .set('Authorization', `Bearer ${memberToken()}`)
      .send({ amount: 150, donationType: 'tithe', paymentMethod: 'card', callbackUrl: 'https://evil.example/steal' });

    const { callbackUrl } = initSpy.mock.calls[0][0];
    expect(callbackUrl.startsWith('http://localhost:3000/donate?reference=')).toBe(true);
  });
});

describe('Paystack webhook (full server)', () => {
  const SECRET = 'test_paystack_secret';
  let app;
  let donationModel;

  beforeEach(() => {
    jest.resetModules();
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    donationModel = buildDonationModelMock();
    jest.doMock('../../src/models/donationModel', () => donationModel);
    app = require('../../src/server');
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  const sendWebhook = (body, signature) =>
    request(app)
      .post('/api/donations/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(body);

  test('accepts a correctly signed charge.success and completes the donation', async () => {
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'DON-REF-1', amount: 15000 } });
    const signature = crypto.createHmac('sha512', SECRET).update(body).digest('hex');

    const response = await sendWebhook(body, signature);

    expect(response.status).toBe(200);
    expect(donationModel.updateDonationStatusByReference).toHaveBeenCalledWith('DON-REF-1', 'completed');
  });

  test('rejects an invalid signature', async () => {
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'DON-REF-1', amount: 15000 } });

    const response = await sendWebhook(body, 'not-a-real-signature');

    expect(response.status).toBe(401);
    expect(donationModel.updateDonationStatusByReference).not.toHaveBeenCalled();
  });

  test('does not complete a donation when the charged amount is too low', async () => {
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'DON-REF-1', amount: 100 } });
    const signature = crypto.createHmac('sha512', SECRET).update(body).digest('hex');

    const response = await sendWebhook(body, signature);

    expect(response.status).toBe(200);
    expect(donationModel.updateDonationStatusByReference).not.toHaveBeenCalled();
  });
});

describe('Mock payments', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('are refused in production when Paystack is not configured', async () => {
    process.env.NODE_ENV = 'production';
    const paymentService = jest.requireActual('../../src/services/paymentService');

    await expect(paymentService.verifyPayment('DON-REF-1')).rejects.toMatchObject({ statusCode: 503 });
    await expect(
      paymentService.initializePayment({ email: 'a@b.com', amount: 10, reference: 'DON-REF-1' })
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});

describe('Google OAuth redirects', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.FRONTEND_URL = 'https://app.example.org';
    jest.doMock('../../src/models/userModel', () => ({
      findUserByEmail: jest.fn().mockResolvedValue(null),
    }));
    const authRoutes = require('../../src/routes/authRoutes');
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
  });

  const getStatePayload = (location) => {
    const state = new URL(location).searchParams.get('state');
    const [encoded] = state.split('.');
    return { state, payload: JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) };
  };

  test('ignores a redirectUri on a foreign origin', async () => {
    const response = await request(app).get(
      '/api/auth/google/start?redirectUri=https://evil.example/collect'
    );

    expect(response.status).toBe(302);
    const { payload } = getStatePayload(response.headers.location);
    expect(payload.redirectUri).toBe('https://app.example.org/oauth/google/callback');
  });

  test('keeps a redirectUri on the configured frontend origin', async () => {
    const response = await request(app).get(
      '/api/auth/google/start?redirectUri=https://app.example.org/custom-callback'
    );

    const { payload } = getStatePayload(response.headers.location);
    expect(payload.redirectUri).toBe('https://app.example.org/custom-callback');
  });

  test('rejects a forged state and never redirects to its target', async () => {
    const forgedPayload = Buffer.from(
      JSON.stringify({ mode: 'web', redirectUri: 'https://evil.example/collect', exp: Date.now() + 60000 })
    ).toString('base64url');

    const response = await request(app).get(
      `/api/auth/google/callback?code=abc&state=${forgedPayload}.forged-signature`
    );

    expect(response.status).toBe(302);
    expect(response.headers.location.startsWith('https://app.example.org/oauth/google/callback')).toBe(true);
    expect(response.headers.location).toContain('error=');
  });

  test('resend-verification does not reveal whether an account exists', async () => {
    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'nobody@example.org' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Google access token audience', () => {
  beforeEach(() => {
    jest.resetModules();
    ['GOOGLE_CLIENT_ID', 'GOOGLE_WEB_CLIENT_ID', 'GOOGLE_ANDROID_CLIENT_ID', 'GOOGLE_ALLOWED_CLIENT_IDS'].forEach(
      (key) => delete process.env[key]
    );
  });

  const buildApp = (tokenInfo) => {
    jest.doMock('axios', () => ({
      get: jest.fn((url) =>
        Promise.resolve(
          url.includes('tokeninfo')
            ? { data: tokenInfo }
            : { data: { email: 'x@example.org', email_verified: true, sub: '1' } }
        )
      ),
    }));
    jest.doMock('../../src/models/userModel', () => ({
      findUserByGoogleId: jest.fn().mockResolvedValue(null),
      findUserByEmail: jest.fn().mockResolvedValue(null),
      createUser: jest.fn().mockResolvedValue({ id: 3, email: 'x@example.org', role: 'member' }),
    }));
    const authRoutes = require('../../src/routes/authRoutes');
    const { errorHandler } = require('../../src/middleware/errorHandler');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
    return app;
  };

  test('rejects tokens when no client IDs are configured', async () => {
    const app = buildApp({ aud: 'some-other-app' });
    const response = await request(app).post('/api/auth/google').send({ accessToken: 't' });
    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/not configured/i);
  });

  test('rejects tokens issued to another app', async () => {
    process.env.GOOGLE_WEB_CLIENT_ID = 'our-app';
    const app = buildApp({ aud: 'some-other-app' });
    const response = await request(app).post('/api/auth/google').send({ accessToken: 't' });
    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/audience/i);
  });

  test('accepts tokens issued to our app', async () => {
    process.env.GOOGLE_WEB_CLIENT_ID = 'our-app';
    const app = buildApp({ aud: 'our-app' });
    const response = await request(app).post('/api/auth/google').send({ accessToken: 't' });
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeTruthy();
  });
});

describe('Profile photo uploads', () => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'profile-images');
  let app;
  let createdFiles = [];

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../src/models/userModel', () => ({
      updateUserProfileImage: jest.fn((id, url) => Promise.resolve({ id, profile_image_url: url })),
    }));
    jest.doMock('../../src/models/auditLogModel', () => ({ createAuditLog: jest.fn() }));
    const userRoutes = require('../../src/routes/userRoutes');
    const { errorHandler } = require('../../src/middleware/errorHandler');
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    createdFiles.forEach((file) => fs.rmSync(path.join(uploadDir, file), { force: true }));
    createdFiles = [];
  });

  test('rejects non-image content types', async () => {
    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', `Bearer ${memberToken()}`)
      .attach('photo', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.html',
        contentType: 'text/html',
      });

    expect(response.status).toBe(400);
  });

  test('stores files with a server-chosen extension, not the client filename', async () => {
    const response = await request(app)
      .put('/api/users/profile/photo')
      .set('Authorization', `Bearer ${memberToken()}`)
      .attach('photo', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.html',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    const url = response.body.data.profile_image_url;
    createdFiles.push(path.basename(url));
    expect(url).toMatch(/\.png$/);
  });
});

describe('sanitizeUser', () => {
  test('removes password and verification token fields', () => {
    const { sanitizeUser } = jest.requireActual('../../src/utils/helpers');
    const result = sanitizeUser({
      id: 1,
      password: 'hash',
      email_verification_token: 'secret',
      email_verification_expires_at: new Date(),
    });

    expect(result).toEqual({ id: 1 });
  });
});
