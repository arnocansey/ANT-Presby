const axios = require('axios');

/**
 * Expo push delivery. Never throws: push is best-effort on top of in-app notifications.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

const isExpoPushToken = (token) => typeof token === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
};

const sendPush = async (tokens, { title, body, data = {} }) => {
  const unique = [...new Set(Array.isArray(tokens) ? tokens : [])].filter(isExpoPushToken);
  if (unique.length === 0) {
    return { sent: 0, invalidTokens: [] };
  }

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  let sent = 0;
  const invalidTokens = [];

  for (const batch of chunk(unique, BATCH_SIZE)) {
    try {
      const response = await axios.post(
        EXPO_PUSH_URL,
        batch.map((to) => ({ to, title, body, data, sound: 'default' })),
        { headers, timeout: 15000 }
      );
      const tickets = Array.isArray(response.data?.data) ? response.data.data : [];
      tickets.forEach((ticket, index) => {
        if (ticket?.status === 'ok') {
          sent += 1;
        } else if (ticket?.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(batch[index]);
        }
      });
    } catch (error) {
      console.warn('Push batch failed:', error.message);
    }
  }

  return { sent, invalidTokens };
};

module.exports = {
  EXPO_PUSH_URL,
  isExpoPushToken,
  sendPush,
};
