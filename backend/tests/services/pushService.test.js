describe('pushService.sendPush', () => {
  let axios;
  let pushService;
  const original = process.env.EXPO_ACCESS_TOKEN;

  const token = (n) => `ExponentPushToken[device-${n}]`;
  const okTickets = (count) => ({ data: { data: Array.from({ length: count }, () => ({ status: 'ok' })) } });

  beforeEach(() => {
    jest.resetModules();
    delete process.env.EXPO_ACCESS_TOKEN;
    axios = { post: jest.fn((url, messages) => Promise.resolve(okTickets(messages.length))) };
    jest.doMock('axios', () => axios);
    pushService = require('../../src/services/pushService');
  });

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_ACCESS_TOKEN;
    else process.env.EXPO_ACCESS_TOKEN = original;
  });

  test('sends in batches of at most 100', async () => {
    const tokens = Array.from({ length: 250 }, (_, n) => token(n));

    const result = await pushService.sendPush(tokens, { title: 'Hi', body: 'There', data: { type: 'x' } });

    expect(axios.post).toHaveBeenCalledTimes(3);
    expect(axios.post.mock.calls.map(([, messages]) => messages.length)).toEqual([100, 100, 50]);
    expect(axios.post.mock.calls[0][0]).toBe('https://exp.host/--/api/v2/push/send');
    expect(axios.post.mock.calls[0][1][0]).toEqual({ to: token(0), title: 'Hi', body: 'There', data: { type: 'x' }, sound: 'default' });
    expect(result).toEqual({ sent: 250, invalidTokens: [] });
  });

  test('drops duplicates and tokens that are not Expo push tokens', async () => {
    await pushService.sendPush([token(1), token(1), 'not-a-token', '', null], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[0][1].map((m) => m.to)).toEqual([token(1)]);
  });

  test('does nothing when there are no tokens', async () => {
    expect(await pushService.sendPush([], { title: 't', body: 'b' })).toEqual({ sent: 0, invalidTokens: [] });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('reports DeviceNotRegistered tokens as invalid', async () => {
    axios.post.mockResolvedValue({
      data: { data: [{ status: 'ok' }, { status: 'error', details: { error: 'DeviceNotRegistered' } }, { status: 'error', details: { error: 'MessageRateExceeded' } }] },
    });

    const result = await pushService.sendPush([token(1), token(2), token(3)], { title: 't', body: 'b' });

    expect(result).toEqual({ sent: 1, invalidTokens: [token(2)] });
  });

  test('a failed batch is logged, never thrown', async () => {
    axios.post.mockRejectedValue(new Error('network down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(pushService.sendPush([token(1)], { title: 't', body: 'b' })).resolves.toEqual({ sent: 0, invalidTokens: [] });

    warn.mockRestore();
  });

  test('sends the Expo access token only when configured', async () => {
    await pushService.sendPush([token(1)], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[0][2].headers).not.toHaveProperty('Authorization');

    jest.resetModules();
    process.env.EXPO_ACCESS_TOKEN = 'test-placeholder-not-a-real-token';
    jest.doMock('axios', () => axios);
    const configured = require('../../src/services/pushService');
    await configured.sendPush([token(1)], { title: 't', body: 'b' });
    expect(axios.post.mock.calls[1][2].headers.Authorization).toBe('Bearer test-placeholder-not-a-real-token');
  });

  test('recognises Expo push token formats', () => {
    expect(pushService.isExpoPushToken('ExponentPushToken[abc]')).toBe(true);
    expect(pushService.isExpoPushToken('ExpoPushToken[abc]')).toBe(true);
    expect(pushService.isExpoPushToken('abc')).toBe(false);
  });
});
