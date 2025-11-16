import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server';
import { User } from '../src/models/User';
import { Service } from '../src/models/Service';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import os from 'os';
import path from 'path';

let mongo: MongoMemoryServer;

const downloadDir = path.join(os.tmpdir(), `mongoms-${process.pid}-${Math.random().toString(36).slice(2)}`);

describe('Order Endpoints', () => {
  let userId: string;
  let serviceId: string;
  let authToken: string;

  beforeAll(async () => {
    process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14', downloadDir } });
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  beforeEach(async () => {
    // Clean DB before each test (guard for possible undefined db in some environments)
    const db = mongoose.connection.db;
    if (db && typeof db.collections === 'function') {
      const collections = await db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }

    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890'
    });
    userId = (user._id as unknown as mongoose.Types.ObjectId).toString();

    const service = await Service.create({
      name: 'Test Service',
      description: 'Test Description',
      price: 100,
      duration: 60,
      category: 'WASH_AND_FOLD',
      image: 'https://example.com/image.jpg'
    });
    serviceId = (service._id as unknown as mongoose.Types.ObjectId).toString();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = loginResponse.body.token;
  });

  it('should create a new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [ { service: serviceId, quantity: 1 } ],
        pickupAddress: '123 Test St',
        deliveryAddress: '456 Test Ave',
        scheduledPickup: new Date().toISOString(),
        scheduledDelivery: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.items[0].service).toBe(serviceId);
  });

  it('should get all orders for the user', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get a specific order by ID', async () => {
    // First create an order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          {
            service: serviceId,
            quantity: 1
          }
        ],
        pickupAddress: '123 Test St',
        deliveryAddress: '456 Test Ave',
        scheduledPickup: new Date().toISOString(),
        scheduledDelivery: new Date(Date.now() + 86400000).toISOString()
      });

    const orderId = orderRes.body.data._id;

    // Then get the order
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(orderId);
  });

  it('should return 404 for non-existent order', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('should validate order input', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [], // Empty items array
        pickupAddress: '123 Test St',
        deliveryAddress: '456 Test Ave'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});