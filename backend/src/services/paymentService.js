const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const hasPaystackConfig = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

// Mock payments are a local-development convenience only; never fake a successful charge in production.
const isMockPaymentAllowed = () => process.env.NODE_ENV !== 'production';

const createPaymentConfigError = () => {
  const error = new Error('Payments are not configured. Please try again later.');
  error.statusCode = 503;
  return error;
};

const generatePaymentReference = () => {
  const random = crypto.randomBytes(4).toString('hex');
  return `DON-${Date.now()}-${random}`;
};

const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

const initializePayment = async ({ email, amount, reference, callbackUrl, metadata = {} }) => {
  if (!hasPaystackConfig()) {
    if (!isMockPaymentAllowed()) {
      throw createPaymentConfigError();
    }

    return {
      provider: 'mock',
      reference,
      authorization_url: callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/donate?reference=${reference}`,
      access_code: null,
    };
  }

  const payload = {
    email,
    amount: toMinorUnits(amount),
    currency: 'GHS',
    reference,
    callback_url: callbackUrl,
    metadata,
  };

  const response = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, payload, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return {
    provider: 'paystack',
    ...response.data.data,
  };
};

const verifyPayment = async (reference) => {
  if (!hasPaystackConfig()) {
    if (!isMockPaymentAllowed()) {
      throw createPaymentConfigError();
    }

    return {
      provider: 'mock',
      reference,
      status: 'success',
      channel: 'mock',
      paid_at: new Date().toISOString(),
      amount: null,
    };
  }

  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      timeout: 15000,
    }
  );

  const data = response.data.data;

  return {
    provider: 'paystack',
    reference: data.reference,
    status: data.status,
    channel: data.channel,
    paid_at: data.paid_at,
    amount: data.amount,
    raw: data,
  };
};

// Paystack reports amounts in minor units (kobo/pesewas). A null amount means a mock payment.
const isPaidAmountValid = (donationAmount, paidMinorAmount) => {
  if (paidMinorAmount === null || paidMinorAmount === undefined) {
    return isMockPaymentAllowed();
  }

  return Number(paidMinorAmount) >= toMinorUnits(donationAmount);
};

const isValidWebhookSignature = (rawBody, signature) => {
  if (!process.env.PAYSTACK_SECRET_KEY) return false;
  if (!signature || typeof signature !== 'string') return false;

  const computed = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  const expected = Buffer.from(computed);
  const provided = Buffer.from(signature);

  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};

module.exports = {
  hasPaystackConfig,
  isMockPaymentAllowed,
  generatePaymentReference,
  initializePayment,
  verifyPayment,
  isPaidAmountValid,
  isValidWebhookSignature,
};
