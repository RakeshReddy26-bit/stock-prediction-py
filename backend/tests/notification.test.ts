import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server';
import { User, IUser } from '../src/models/User';
import { Notification, INotification } from '../src/models/Notification';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

let mongo: MongoMemoryServer;

describe('Notification System', () => {
  let token: string;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }

    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestPass123',
    }) as IUser;
    userId = user._id as unknown as mongoose.Types.ObjectId;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'TestPass123' });
    token = loginRes.body.token;
  });

  it('should create a notification when points are earned', async () => {
    const notification = await Notification.create({
      user: userId,
      type: 'POINTS_EARNED',
      message: 'You earned 10 points!',
      data: { points: 10 }
    }) as INotification;

    expect(notification).toBeDefined();
    expect(notification.type).toBe('POINTS_EARNED');
    expect(notification.message).toBe('You earned 10 points!');
  });

  it('should get all notifications for a user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should mark a notification as read', async () => {
    const notification = await Notification.create({
      user: userId,
      type: 'TEST',
      message: 'Test notification',
      read: false
    }) as INotification;

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
  });

  it('should delete a notification', async () => {
    const notification = await Notification.create({
      user: userId,
      type: 'TEST',
      message: 'Test notification to delete'
    }) as INotification;

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deletedNotification = await Notification.findById(notification._id);
    expect(deletedNotification).toBeNull();
  });

  it('should return 404 for non-existent notification', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/notifications/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});