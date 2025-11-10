import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/server';
import { Service } from '../src/models/Service';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import testUtils from './testUtils';

let mongo: MongoMemoryServer;

describe('Service Endpoints', () => {
  let token: string;
  let serviceId: mongoose.Types.ObjectId;

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
    await testUtils.clearDatabase();
    const auth = await testUtils.createAdminAndToken();
    token = auth.token;
    const service = await testUtils.seedService();
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