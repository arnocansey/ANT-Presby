const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const tokenFor = (userId, role) =>
  `Bearer ${jwt.sign({ userId, email: `u${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '10m' })}`;
const admin = () => tokenFor(1, 'admin');
const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/antpresby/events';

describe('Event images (admin)', () => {
  let eventModel;
  let storage;
  let auditLogModel;
  let app;

  beforeEach(() => {
    jest.resetModules();
    eventModel = {
      getEventById: jest.fn().mockResolvedValue({ id: 4, name: 'Harvest', image_url: `${CLOUD}/old123.png` }),
      setEventImage: jest.fn().mockResolvedValue(1),
    };
    storage = {
      uploadImage: jest.fn().mockResolvedValue({ url: `${CLOUD}/new123.png`, publicId: 'antpresby/events/new123', fileName: 'x' }),
      deleteImage: jest.fn().mockResolvedValue(true),
      isOwnImageUrl: jest.fn().mockReturnValue(true),
    };
    auditLogModel = { createAuditLog: jest.fn().mockResolvedValue({}) };
    jest.doMock('../../src/models/eventModel', () => eventModel);
    jest.doMock('../../src/services/imageStorage', () => storage);
    jest.doMock('../../src/models/auditLogModel', () => auditLogModel);
    jest.doMock('../../src/models/notificationModel', () => ({}));

    app = express();
    app.use(express.json());
    app.use('/api/admin/events', require('../../src/routes/adminEventRoutes'));
    app.use(require('../../src/middleware/errorHandler').errorHandler);
  });

  const upload = (auth, id = 4) =>
    request(app)
      .post(`/api/admin/events/${id}/image`)
      .set('Authorization', auth)
      .attach('image', Buffer.from('fake-png'), { filename: 'cover.png', contentType: 'image/png' });

  test('members cannot change event images', async () => {
    const response = await upload(tokenFor(7, 'member'));

    expect(response.status).toBe(403);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  test('uploading saves the new image, then deletes the old one, and is audited', async () => {
    const response = await upload(admin());

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ image_url: `${CLOUD}/new123.png` });
    expect(storage.uploadImage.mock.calls[0][1]).toEqual({ kind: 'events', actorId: 1 });
    expect(eventModel.setEventImage).toHaveBeenCalledWith(4, `${CLOUD}/new123.png`);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/old123.png`);
    expect(auditLogModel.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'event', entityId: 4, action: 'update_image' })
    );
  });

  test.each([
    ['an unknown event', 99],
    ['a malformed id', 'abc'],
  ])('%s returns 404 without storing anything', async (_label, id) => {
    eventModel.getEventById.mockResolvedValue(undefined);

    const response = await upload(admin(), id);

    expect(response.status).toBe(404);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  test('if the event was deleted during the upload, the new image is removed and 404 returned', async () => {
    eventModel.setEventImage.mockResolvedValue(0);

    const response = await upload(admin());

    expect(response.status).toBe(404);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/new123.png`);
    expect(storage.deleteImage).not.toHaveBeenCalledWith(`${CLOUD}/old123.png`);
    expect(auditLogModel.createAuditLog).not.toHaveBeenCalled();
  });

  test('uploading without a file returns 400', async () => {
    const response = await request(app).post('/api/admin/events/4/image').set('Authorization', admin());

    expect(response.status).toBe(400);
  });

  test('when storage is down the event keeps its image', async () => {
    storage.uploadImage.mockRejectedValue(Object.assign(new Error('Image storage is unavailable, please try again'), { statusCode: 502 }));

    const response = await upload(admin());

    expect(response.status).toBe(502);
    expect(eventModel.setEventImage).not.toHaveBeenCalled();
    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

  test('removing clears the image and deletes it from storage', async () => {
    const response = await request(app).delete('/api/admin/events/4/image').set('Authorization', admin());

    expect(response.status).toBe(200);
    expect(eventModel.setEventImage).toHaveBeenCalledWith(4, null);
    expect(storage.deleteImage).toHaveBeenCalledWith(`${CLOUD}/old123.png`);
    expect(auditLogModel.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'remove_image' }));
  });

  test('removing the image of an unknown event returns 404', async () => {
    eventModel.getEventById.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/admin/events/99/image').set('Authorization', admin());

    expect(response.status).toBe(404);
    expect(eventModel.setEventImage).not.toHaveBeenCalled();
  });
});
