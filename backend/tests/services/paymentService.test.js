describe('paymentService.initializePayment', () => {
  const savedKey = process.env.PAYSTACK_SECRET_KEY;
  let axios;
  let paymentService;

  beforeEach(() => {
    jest.resetModules();
    process.env.PAYSTACK_SECRET_KEY = 'test-placeholder-not-a-real-key';
    axios = { post: jest.fn().mockResolvedValue({ data: { data: { authorization_url: 'https://checkout.example' } } }) };
    jest.doMock('axios', () => axios);
    paymentService = require('../../src/services/paymentService');
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = savedKey;
  });

  test('charges in Ghana cedis, in pesewas', async () => {
    await paymentService.initializePayment({ email: 'a@test.com', amount: 50, reference: 'DON-1', callbackUrl: 'https://x/cb' });

    expect(axios.post.mock.calls[0][1]).toEqual(expect.objectContaining({ currency: 'GHS', amount: 5000 }));
  });
});
