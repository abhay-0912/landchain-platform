'use strict';

/**
 * Property endpoint tests using supertest + jest.
 * Database, blockchain, and auth are mocked.
 */

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

jest.mock('../src/config/database', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../src/config/blockchain', () => ({
  provider: null,
  wallet: null,
  propertyRegistry: null,
  transferRegistry: null,
  mortgageContract: null,
}));

jest.mock('../src/services/blockchainService', () => ({
  registerPropertyOnChain: jest.fn().mockResolvedValue({ transactionHash: '0xabc123' }),
  initiateTransferOnChain: jest.fn().mockResolvedValue(null),
  confirmByBuyerOnChain: jest.fn().mockResolvedValue(null),
  approveByOfficerOnChain: jest.fn().mockResolvedValue(null),
  completeTransferOnChain: jest.fn().mockResolvedValue(null),
  cancelTransferOnChain: jest.fn().mockResolvedValue(null),
  lockPropertyOnChain: jest.fn().mockResolvedValue(null),
  releasePropertyOnChain: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
  sendTransferNotificationEmail: jest.fn().mockResolvedValue(undefined),
  sendApprovalEmail: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/database');

const AuditLog = require('../src/models/AuditLog');
jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 'audit-1' });

// Helper: create a signed JWT for test user
function makeToken(user = {}) {
  const defaults = { id: 'user-1', role: 'citizen', status: 'active' };
  return jwt.sign({ id: (user.id || defaults.id) }, process.env.JWT_SECRET);
}

// Standard test user returned by auth middleware (findById)
const TEST_USER = {
  id: 'user-1',
  email: 'alice@example.com',
  full_name: 'Alice',
  role: 'citizen',
  status: 'active',
  kyc_status: 'pending',
  wallet_address: null,
};

const OFFICER_USER = {
  id: 'officer-1',
  email: 'officer@gov.org',
  full_name: 'Officer Bob',
  role: 'officer',
  status: 'active',
  kyc_status: 'approved',
  wallet_address: null,
};

const TEST_PROPERTY = {
  id: 'prop-1',
  owner_id: 'user-1',
  property_id: 'PROP-001',
  survey_number: 'SN-001',
  address: '123 Main St',
  city: 'Delhi',
  state: 'Delhi',
  area: 500,
  property_type: 'residential',
  market_value: 5000000,
  status: 'active',
  blockchain_tx_hash: '0xabc123',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('POST /api/v1/properties', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a property successfully', async () => {
    const token = makeToken();

    db.query
      .mockResolvedValueOnce({ rows: [TEST_USER] })   // auth middleware findById
      .mockResolvedValueOnce({ rows: [TEST_PROPERTY] }) // Property.create
      .mockResolvedValueOnce({ rows: [{ id: 'hist-1' }] }); // addOwnershipHistory

    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propertyId: 'PROP-001',
        surveyNumber: 'SN-001',
        address: '123 Main St',
        city: 'Delhi',
        state: 'Delhi',
        area: 500,
        propertyType: 'residential',
        marketValue: 5000000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.property.property_id).toBe('PROP-001');
  });

  it('returns 400 for missing required fields', async () => {
    const token = makeToken();

    db.query.mockResolvedValueOnce({ rows: [TEST_USER] });

    const res = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({ propertyId: 'PROP-001' }); // many fields missing

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .send({ propertyId: 'PROP-001' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/properties/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns property with ownership history', async () => {
    const token = makeToken();

    db.query
      .mockResolvedValueOnce({ rows: [TEST_USER] })     // auth
      .mockResolvedValueOnce({ rows: [TEST_PROPERTY] }) // Property.findById
      .mockResolvedValueOnce({ rows: [{ id: 'hist-1', owner_id: 'user-1', transferred_at: new Date() }] }); // getOwnershipHistory

    const res = await request(app)
      .get('/api/v1/properties/prop-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.property).toBeDefined();
    expect(res.body.ownershipHistory).toBeDefined();
  });

  it('returns 404 for non-existent property', async () => {
    const token = makeToken();

    db.query
      .mockResolvedValueOnce({ rows: [TEST_USER] }) // auth
      .mockResolvedValueOnce({ rows: [] });          // Property.findById → not found

    const res = await request(app)
      .get('/api/v1/properties/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/properties/mine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns list of owned properties', async () => {
    const token = makeToken();

    db.query
      .mockResolvedValueOnce({ rows: [TEST_USER] })       // auth
      .mockResolvedValueOnce({ rows: [TEST_PROPERTY] }); // findByOwner

    const res = await request(app)
      .get('/api/v1/properties/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(1);
  });
});

describe('GET /api/v1/properties/search', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns search results', async () => {
    const token = makeToken();

    db.query
      .mockResolvedValueOnce({ rows: [TEST_USER] })       // auth
      .mockResolvedValueOnce({ rows: [TEST_PROPERTY] }); // Property.search

    const res = await request(app)
      .get('/api/v1/properties/search?city=Delhi')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.properties)).toBe(true);
  });
});

describe('PATCH /api/v1/properties/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows officer to update property', async () => {
    const token = makeToken({ id: 'officer-1' });

    db.query
      .mockResolvedValueOnce({ rows: [OFFICER_USER] })   // auth
      .mockResolvedValueOnce({ rows: [TEST_PROPERTY] })  // findById
      .mockResolvedValueOnce({ rows: [{ ...TEST_PROPERTY, market_value: 6000000 }] }); // update

    const res = await request(app)
      .patch('/api/v1/properties/prop-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketValue: 6000000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('forbids citizen from updating property', async () => {
    const token = makeToken();

    db.query.mockResolvedValueOnce({ rows: [TEST_USER] }); // auth

    const res = await request(app)
      .patch('/api/v1/properties/prop-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketValue: 6000000 });

    expect(res.status).toBe(403);
  });
});
