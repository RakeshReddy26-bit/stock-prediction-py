import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/server';
import { User } from '../src/models/User';
import { Service } from '../src/models/Service';

export async function clearDatabase() {
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
}

export async function createAdminAndToken() {
  const email = `testuser+${Date.now()}@example.com`;
  const password = 'TestPass123';
  const user = await User.create({ name: 'Test User', email, password });
  user.role = 'admin' as any;
  await user.save();

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return { user, token: loginRes.body.token };
}

export async function seedService(overrides: Partial<any> = {}) {
  const base = {
    name: 'Test Service',
    description: 'Test service description',
    price: 29.99,
    duration: 60,
    category: 'WASH_AND_FOLD',
    image: 'test-image.jpg'
  };
  const payload = { ...base, ...overrides };
  const service = await Service.create(payload);
  return service;
}

export async function seedNewService() {
  return seedService({ name: 'New Service', price: 39.99, duration: 90, category: 'DRY_CLEANING', image: 'new-service.jpg' });
}

export default {
  clearDatabase,
  createAdminAndToken,
  seedService,
  seedNewService,
};
