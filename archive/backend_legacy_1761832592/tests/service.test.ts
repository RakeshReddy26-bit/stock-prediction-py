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

describe('Service Endpoints', () => {
  let token: string;
  let userId: mongoose.Types.ObjectId;
  let serviceId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const downloadDir = path.join(os.tmpdir(), `mongoms-${process.pid}-${Math.random().toString(36).slice(2)}`);
    process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14', downloadDir } });
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  }, 120000);

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
    });
    userId = user._id as unknown as mongoose.Types.ObjectId;

    // Elevate to admin for write operations in tests
    user.role = 'admin' as any;
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'TestPass123' });
    token = loginRes.body.token;

    const service = await Service.create({
      name: 'Test Service',
      description: 'Test service description',
      price: 29.99,
      duration: 60,
      category: 'WASH_AND_FOLD',
      image: 'test-image.jpg'
    });
    serviceId = service._id as unknown as mongoose.Types.ObjectId;
  });

  it('should get all services', async () => {
    const res = await request(app)
      .get('/api/services')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get a specific service by ID', async () => {
    const res = await request(app)
      .get(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(serviceId.toString());
    expect(res.body.data.name).toBe('Test Service');
  });

  it('should create a new service', async () => {
    const newService = {
      name: 'New Service',
      description: 'New service description',
      price: 39.99,
      duration: 90,
      category: 'DRY_CLEANING',
      image: 'new-service.jpg'
    };

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send(newService);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newService.name);
    expect(res.body.data.price).toBe(newService.price);
  });

  it('should update a service', async () => {
    const updateData = {
      name: 'Updated Service',
      price: 49.99
    };

    const res = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updateData.name);
    expect(res.body.data.price).toBe(updateData.price);
  });

  it('should delete a service', async () => {
    const res = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deletedService = await Service.findById(serviceId);
    expect(deletedService).toBeNull();
  });

  it('should return 404 for non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/services/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should validate service input', async () => {
    const invalidService = {
      name: '',
      price: -10,
      duration: 0
    };

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidService);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});