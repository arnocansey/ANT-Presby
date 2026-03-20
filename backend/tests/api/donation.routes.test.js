const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

describe('Donation API', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock('../../src/models/donationModel', () => ({
      createDonation: jest.fn().mockResolvedValue({ id: 55, reference: 'DON-REF-1', status: 'pending' }),
      getDonationByReference: jest.fn().mockResolvedValue({ id: 55, reference: 'DON-REF-1', user_id: 7, status: 'pending' }),
      updateDonationStatusByReference: jest.fn().mockResolvedValue({ id: 55, reference: 'DON-REF-1', status: 'completed' }),
      getAllDonations: jest.fn().mockResolvedValue([]),
      countDonations: jest.fn().mockResolvedValue(0),
      getDonationById: jest.fn().mockResolvedValue(null),
      getUserDonations: jest.fn().mockResolvedValue([]),
      updateDonationStatus: jest.fn().mockResolvedValue(null),
      updateDonation: jest.fn().mockResolvedValue(null),
      deleteDonation: jest.fn().mockResolvedValue(null),
      getDonationStatistics: jest.fn().mockResolvedValue({}),
      getDonationsByType: jest.fn().mockResolvedValue([]),
    }));

    jest.doMock('../../src/services/paymentService', () => ({
      hasPaystackConfig: jest.fn().mockReturnValue(false),
      generatePaymentReference: jest.fn().mockReturnValue('DON-REF-1'),
      initializePayment: jest.fn().mockResolvedValue({ authorization_url: 'http://checkout.local' }),
      verifyPayment: jest.fn().mockResolvedValue({ status: 'success', reference: 'DON-REF-1' }),
      isValidWebhookSignature: jest.fn().mockReturnValue(true),
    }));

    const donationRoutes = require('../../src/routes/donationRoutes');

    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/donations', donationRoutes);
  });

  test('POST /api/donations/initialize-payment returns checkout data for authenticated user', async () => {
    const token = jwt.sign({ userId: 7, email: 'donor@test.com', role: 'member' }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });

    const response = await request(app)
      .post('/api/donations/initialize-payment')
      .set('Cookie', [`access_token=${token}`])
      .send({
        amount: 150,
        donationType: 'tithe',
        paymentMethod: 'card',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.payment.authorization_url).toBe('http://checkout.local');
  });

  test('GET /api/donations/verify/:reference requires authentication', async () => {
    const response = await request(app).get('/api/donations/verify/DON-REF-1');
    expect(response.status).toBe(401);
  });
});
