import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import 'dotenv/config';
import app from '../src/index.js';

const TEST_DB = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/digital-janitor-test';

const testUser = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'testpassword123',
};

let token;
let userId;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  // Clean up test user
  if (userId) {
    await mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  }
  await mongoose.disconnect();
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    token = res.body.token;
    userId = res.body.user._id;
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject requests without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Scans API', () => {
  let scanId;

  it('should create a scan', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scanName: 'Test Scan',
        folderPath: 'test-folder',
        fileCount: 42,
        totalSizeBytes: 1024 * 1024 * 50,
        categoryCounts: { images: 10, documents: 5, unknown: 27 },
        clutterDebtScore: 35,
        status: 'complete',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.scanName).toBe('Test Scan');
    expect(res.body.data.userId).toBe(userId);
    scanId = res.body.data._id;
  });

  it('should list scans for current user', async () => {
    const res = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get scan stats', async () => {
    const res = await request(app)
      .get('/api/scans/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalScans).toBeGreaterThan(0);
  });

  it('should delete a scan', async () => {
    const res = await request(app)
      .delete(`/api/scans/${scanId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('AI Status API', () => {
  it('should return AI status (may be offline)', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('available');
    expect(res.body.data).toHaveProperty('model');
  });
});
