'use strict';

/**
 * Auth endpoint tests using supertest + jest.
 * Database and blockchain are fully mocked.
 */

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// ── Mock database ──────────────────────────────────────────────────────────────
jest.mock('../src/config/database', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  getClient: jest.fn(),
}));

// ── Mock blockchain config (prevent ethers.js network calls) ───────────────────
jest.mock('../src/config/blockchain', () => ({
  provider: null,
  wallet: null,
  propertyRegistry: null,
  transferRegistry: null,
  mortgageContract: null,
}));

// ── Mock email service ──────────────────────────────────────────────────────────
jest.mock('../src/services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
  sendTransferNotificationEmail: jest.fn().mockResolvedValue(undefined),
  sendApprovalEmail: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/config/database');

// Stub AuditLog.create so it never hits the DB
const AuditLog = require('../src/models/AuditLog');
jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 'audit-1' });

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a new user and returns a JWT', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] }) // findByEmail → not found
      .mockResolvedValueOnce({             // User.create
        rows: [{
          id: 'user-1',
          email: 'alice@example.com',
          full_name: 'Alice',
          role: 'citizen',
          status: 'active',
          kyc_status: 'pending',
          wallet_address: null,
          created_at: new Date(),
        }],
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123', fullName: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 409 when email already registered', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'user-existing', email: 'alice@example.com' }],
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123', fullName: 'Alice' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'password123', fullName: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 for short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'short', fullName: 'Alice' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when fullName is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns JWT on valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 12);
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        email: 'alice@example.com',
        password_hash: hash,
        full_name: 'Alice',
        role: 'citizen',
        status: 'active',
        kyc_status: 'pending',
      }],
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 12);
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        email: 'alice@example.com',
        password_hash: hash,
        full_name: 'Alice',
        role: 'citizen',
        status: 'active',
      }],
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 when user not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for suspended account', async () => {
    const hash = await bcrypt.hash('password123', 12);
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        email: 'alice@example.com',
        password_hash: hash,
        full_name: 'Alice',
        role: 'citizen',
        status: 'suspended',
      }],
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/suspended/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bad-email', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns current user with valid token', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);

    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        email: 'alice@example.com',
        full_name: 'Alice',
        role: 'citizen',
        status: 'active',
        kyc_status: 'pending',
      }],
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-1');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
