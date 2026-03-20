const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const hasPaystackConfig = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

const generatePaymentReference = () => {
  const random = crypto.randomBytes(4).toString('hex');
  return `DON-${Date.now()}-${random}`;
};

const initializePayment = async ({ email, amount, reference, callbackUrl, metadata = {} }) => {
  if (!hasPaystackConfig()) {
    return {
      provider: 'mock',
      reference,
      authorization_url: callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/donate?reference=${reference}`,
      access_code: null,
    };
  }

  const payload = {
    email,
    amount: Math.round(Number(amount) * 100),
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
    return {
      provider: 'mock',
      reference,
      status: 'success',
      channel: 'mock',
      paid_at: new Date().toISOString(),
    };
  }

  const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    timeout: 15000,
  });

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

const isValidWebhookSignature = (rawBody, signature) => {
  if (!process.env.PAYSTACK_SECRET_KEY) return false;
  if (!signature) return false;

  const computed = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  return computed === signature;
};

module.exports = {
  hasPaystackConfig,
  generatePaymentReference,
  initializePayment,
  verifyPayment,
  isValidWebhookSignature,
};
