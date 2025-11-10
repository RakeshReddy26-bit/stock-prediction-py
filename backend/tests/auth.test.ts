import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import os from 'os';
import path from 'path';

let mongo: MongoMemoryServer;

const downloadDir = path.join(os.tmpdir(), `mongoms-${process.pid}-${Math.random().toString(36).slice(2)}`);

describe('Auth Endpoints', () => {
  let token: string;
  let resetToken: string;

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
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  });

  it('should signup a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'TestPass123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('testuser@example.com');
    token = res.body.token;
  });

  it('should login the user', async () => {
    // Ensure user exists
    await request(app).post('/api/auth/signup').send({ name: 'Test User', email: 'login@example.com', password: 'TestPass123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'TestPass123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(res.body.token).toBeDefined();
  });

  it('should request a password reset', async () => {
    await request(app).post('/api/auth/signup').send({ name: 'Reset User', email: 'reset@example.com', password: 'TestPass123' });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeDefined();
    resetToken = res.body.resetToken;
  });

  it('should reset the password', async () => {
    await request(app).post('/api/auth/signup').send({ name: 'Reset2', email: 'reset2@example.com', password: 'TestPass123' });
    const { body } = await request(app).post('/api/auth/forgot-password').send({ email: 'reset2@example.com' });
    const res = await request(app).post('/api/auth/reset-password').send({ token: body.resetToken, password: 'NewPass123' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successful');
  });
});