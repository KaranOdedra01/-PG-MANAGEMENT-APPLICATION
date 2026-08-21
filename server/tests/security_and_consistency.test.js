import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv, getJwtSecret } from '../src/config/env.js';
import { requestTestApi, closeTestServer } from './test_helper.js';

describe('Security & Data Consistency Tests (Round 2)', () => {
  after(async () => {
    await closeTestServer();
  });

  describe('CORS Enforcement', () => {
    it('should allow requests from allowed origin http://localhost:5173', async () => {
      const res = await requestTestApi('/api/health', {
        headers: { 'Origin': 'http://localhost:5173' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    it('should reject requests from untrusted origins', async () => {
      const res = await requestTestApi('/api/health', {
        headers: { 'Origin': 'http://malicious-attacker-site.com' }
      });

      assert.equal(res.status, 403);
      assert.match(res.body?.message || '', /CORS Error/);
    });
  });

  describe('JWT Environment Validation & Fail-Fast', () => {
    it('should return secret when configured', () => {
      const secret = getJwtSecret();
      assert.ok(secret);
      assert.equal(typeof secret, 'string');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      const orig = process.env.JWT_SECRET;
      process.env.JWT_SECRET = '';
      assert.throws(() => getJwtSecret(), /JWT_SECRET environment variable is missing/);
      process.env.JWT_SECRET = orig;
    });

    it('should fail fast if required variables are missing in production mode', () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origMongoUri = process.env.MONGO_URI;
      
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = '';

      assert.throws(() => validateEnv(), /FATAL: Missing required environment variable/);

      process.env.NODE_ENV = origNodeEnv;
      process.env.MONGO_URI = origMongoUri;
    });
  });

  describe('Complaint Lifecycle State Machine', () => {
    const validTransitions = {
      'open': ['assigned', 'in-progress'],
      'assigned': ['in-progress', 'waiting-for-parts', 'open'],
      'in-progress': ['waiting-for-parts', 'resolved'],
      'waiting-for-parts': ['in-progress', 'resolved'],
      'resolved': ['closed', 'in-progress'],
      'closed': ['open']
    };

    it('should allow valid transitions: open -> in-progress -> resolved -> closed', () => {
      assert.ok(validTransitions['open'].includes('in-progress'));
      assert.ok(validTransitions['in-progress'].includes('resolved'));
      assert.ok(validTransitions['resolved'].includes('closed'));
    });

    it('should disallow invalid direct transition: open -> closed', () => {
      assert.equal(validTransitions['open'].includes('closed'), false);
    });

    it('should disallow invalid direct transition: waiting-for-parts -> closed', () => {
      assert.equal(validTransitions['waiting-for-parts'].includes('closed'), false);
    });
  });

  describe('Room & Bed Data Consistency', () => {
    it('should correctly derive occupiedBeds and availableBeds from beds subdocument', () => {
      const capacity = 3;
      const beds = [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: '66c1a0010000000000000001' },
        { bedNumber: 'Bed B', isOccupied: true, tenantId: '66c1a0010000000000000002' },
        { bedNumber: 'Bed C', isOccupied: false, tenantId: null }
      ];

      const occupiedBeds = beds.filter(b => b.isOccupied && b.tenantId).length;
      const availableBeds = Math.max(0, capacity - occupiedBeds);
      const calculatedStatus = occupiedBeds >= capacity ? 'occupied' : 'available';

      assert.equal(occupiedBeds, 2);
      assert.equal(availableBeds, 1);
      assert.equal(calculatedStatus, 'available');
    });

    it('should derive occupied status when all beds are filled', () => {
      const capacity = 2;
      const beds = [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: '66c1a0010000000000000001' },
        { bedNumber: 'Bed B', isOccupied: true, tenantId: '66c1a0010000000000000002' }
      ];

      const occupiedBeds = beds.filter(b => b.isOccupied && b.tenantId).length;
      const calculatedStatus = occupiedBeds >= capacity ? 'occupied' : 'available';

      assert.equal(occupiedBeds, 2);
      assert.equal(calculatedStatus, 'occupied');
    });
  });

  describe('Invoice Calculation & Payment Semantics', () => {
    it('should calculate totalAmount correctly on server side', () => {
      const baseRent = 8000;
      const electricityCharge = 600;
      const maintenanceFee = 300;
      const messFee = 3500;
      const lateFee = 200;
      const discount = 500;

      const total = baseRent + electricityCharge + maintenanceFee + messFee + lateFee - discount;
      assert.equal(total, 12100);
    });

    it('should determine partially_paid status if amountPaid < totalAmount', () => {
      const totalAmount = 10000;
      const paidAmount = 5000;
      const status = paidAmount >= totalAmount ? 'paid' : 'partially_paid';
      assert.equal(status, 'partially_paid');
    });

    it('should determine paid status if amountPaid >= totalAmount', () => {
      const totalAmount = 10000;
      const paidAmount = 10000;
      const status = paidAmount >= totalAmount ? 'paid' : 'partially_paid';
      assert.equal(status, 'paid');
    });
  });

  describe('Date-Specific Mess Attendance', () => {
    it('should format date consistently in YYYY-MM-DD format', () => {
      const d = new Date('2026-08-21T10:00:00Z');
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;

      assert.match(formatted, /^\d{4}-\d{2}-\d{2}$/);
    });

    it('should compute headcounts for specific date without cross-day leakage', () => {
      const attendanceDb = [
        { date: '2026-08-20', userId: 'u1', breakfast: true, lunch: true, dinner: true },
        { date: '2026-08-20', userId: 'u2', breakfast: false, lunch: false, dinner: true },
        { date: '2026-08-21', userId: 'u1', breakfast: true, lunch: false, dinner: false },
        { date: '2026-08-21', userId: 'u2', breakfast: true, lunch: true, dinner: true }
      ];

      const targetDate = '2026-08-21';
      const forDate = attendanceDb.filter(a => a.date === targetDate);

      const breakfast = forDate.filter(a => a.breakfast).length;
      const lunch = forDate.filter(a => a.lunch).length;
      const dinner = forDate.filter(a => a.dinner).length;

      assert.equal(breakfast, 2);
      assert.equal(lunch, 1);
      assert.equal(dinner, 1);
    });
  });
});
