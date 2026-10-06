const request = require('supertest');
const { buildModels, buildApp, as, admin, devotional } = require('../helpers/devotionalTestApp');

const validBody = {
  title: 'The Lord is my shepherd',
  scriptureReference: 'Psalm 23:1-3',
  scriptureText: 'The Lord is my shepherd; I shall not want.',
  body: 'A reflection on trust.',
  prayer: 'Lord, lead me.',
  publishDate: '2026-10-06',
};

describe('Admin devotionals API', () => {
  let models;
  let app;

  beforeEach(() => {
    models = buildModels();
    app = buildApp(models);
  });

  test('members cannot author devotionals', async () => {
    const response = await request(app).post('/api/admin/devotionals').set('Authorization', as(7, 'member')).send(validBody);
    expect(response.status).toBe(403);
  });

  test('lists every devotional including drafts and future ones', async () => {
    const response = await request(app).get('/api/admin/devotionals').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(models.devotionalModel.listAll).toHaveBeenCalled();
  });

  test('creates a draft and audits it', async () => {
    const response = await request(app).post('/api/admin/devotionals').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(201);
    expect(models.devotionalModel.createDevotional).toHaveBeenCalledWith(expect.objectContaining({ publishDate: '2026-10-06' }), 1);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'devotional', action: 'create', entityId: 4 })
    );
  });

  test('a second devotional on the same date returns 409', async () => {
    models.devotionalModel.createDevotional.mockRejectedValue(Object.assign(new Error('Unique'), { code: 'P2002' }));

    const response = await request(app).post('/api/admin/devotionals').set('Authorization', admin()).send(validBody);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A devotional is already scheduled for that date');
  });

  test.each([
    ['a missing title', { title: '  ' }],
    ['a missing scripture reference', { scriptureReference: '' }],
    ['an impossible date', { publishDate: '2026-02-30' }],
    ['a non-ISO date', { publishDate: '06/10/2026' }],
    ['an unknown status', { status: 'archived' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const response = await request(app)
      .post('/api/admin/devotionals')
      .set('Authorization', admin())
      .send({ ...validBody, ...overrides });

    expect(response.status).toBe(400);
    expect(models.devotionalModel.createDevotional).not.toHaveBeenCalled();
  });

  test('updates and audits; missing returns 404; date clash returns 409', async () => {
    const ok = await request(app).put('/api/admin/devotionals/4').set('Authorization', admin()).send(validBody);
    expect(ok.status).toBe(200);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));

    models.devotionalModel.updateDevotional.mockResolvedValueOnce(undefined);
    const missing = await request(app).put('/api/admin/devotionals/99').set('Authorization', admin()).send(validBody);
    expect(missing.status).toBe(404);

    models.devotionalModel.updateDevotional.mockRejectedValueOnce(Object.assign(new Error('Unique'), { code: 'P2002' }));
    const clash = await request(app).put('/api/admin/devotionals/4').set('Authorization', admin()).send(validBody);
    expect(clash.status).toBe(409);
  });

  test('deletes and audits; missing returns 404', async () => {
    const ok = await request(app).delete('/api/admin/devotionals/4').set('Authorization', admin());
    expect(ok.status).toBe(200);
    expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));

    models.devotionalModel.deleteDevotional.mockResolvedValueOnce(0);
    const missing = await request(app).delete('/api/admin/devotionals/99').set('Authorization', admin());
    expect(missing.status).toBe(404);
  });

  test('malformed ids return 404 without querying', async () => {
    const put = await request(app).put('/api/admin/devotionals/abc').set('Authorization', admin()).send(validBody);
    const publish = await request(app).post('/api/admin/devotionals/1.5/publish').set('Authorization', admin());

    expect(put.status).toBe(404);
    expect(publish.status).toBe(404);
    expect(models.devotionalModel.updateDevotional).not.toHaveBeenCalled();
    expect(models.devotionalModel.publish).not.toHaveBeenCalled();
  });

  describe('POST /:id/publish', () => {
    const publish = () => request(app).post('/api/admin/devotionals/4/publish').set('Authorization', admin());

    test("publishing today's devotional notifies everyone once", async () => {
      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(true);
      expect(models.devotionalModel.claimNotification).toHaveBeenCalledWith(4);
      expect(models.notificationService.notifyAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'devotional', entityType: 'devotional', entityId: 4 })
      );
      expect(models.auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish' }));
    });

    test('a second press (claim already taken) does not notify again', async () => {
      models.devotionalModel.claimNotification.mockResolvedValue(false);

      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(false);
      expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    });

    test('a future-dated devotional is published without notifying', async () => {
      models.devotionalModel.publish.mockResolvedValue(devotional({ publish_date: '2026-10-09' }));

      const response = await publish();

      expect(response.status).toBe(200);
      expect(response.body.data.notified).toBe(false);
      expect(models.devotionalModel.claimNotification).not.toHaveBeenCalled();
      expect(models.notificationService.notifyAll).not.toHaveBeenCalled();
    });

    test('publishing a missing devotional returns 404', async () => {
      models.devotionalModel.publish.mockResolvedValue(undefined);
      const response = await publish();
      expect(response.status).toBe(404);
    });
  });
});
