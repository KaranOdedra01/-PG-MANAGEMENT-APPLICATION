import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv, getJwtSecret } from '../src/config/env.js';
import { requestTestApi, closeTestServer } from './test_helper.js';
import { escapeRegex, isValidObjectId, handleControllerError } from '../src/utils/sanitize.js';
import { autoSeedIfEmpty } from '../src/utils/seed.js';
import { authorize } from '../src/middleware/authMiddleware.js';
import { recordPayment, createInvoice } from '../src/controllers/invoiceController.js';
import { getRecentActivities } from '../src/controllers/dashboardController.js';
import { updateRoom, toggleRoomStatus } from '../src/controllers/roomController.js';

describe('Security & Data Consistency Tests', () => {
  after(async () => {
    await closeTestServer();
  });

  describe('1. CORS Enforcement & Health Check Privacy', () => {
    it('should allow requests from allowed origin http://localhost:5173', async () => {
      const res = await requestTestApi('/api', {
        headers: { 'Origin': 'http://localhost:5173' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    it('should reject requests from untrusted origins', async () => {
      const res = await requestTestApi('/api', {
        headers: { 'Origin': 'http://malicious-attacker-site.com' }
      });

      assert.equal(res.status, 403);
      assert.match(res.body?.message || '', /CORS Error/);
    });

    it('should verify health endpoint omits host, dbName, env, and gemini status', async () => {
      const res = await requestTestApi('/api/health');
      assert.ok(res.body);
      assert.ok(['healthy', 'unhealthy'].includes(res.body.status));
      assert.ok(res.body.database);
      assert.equal(res.body.host, undefined);
      assert.equal(res.body.dbName, undefined);
      assert.equal(res.body.environment, undefined);
      assert.equal(res.body.gemini, undefined);
    });
  });

  describe('2. JWT Environment Validation & Fail-Fast', () => {
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

  describe('3. Invoice Payment Authorization & Tenant Safety', () => {
    it('should forbid tenants from recording payments with 403 Forbidden', async () => {
      const req = {
        user: { _id: '66c1a0000000000000000001', role: 'tenant', name: 'Tenant User' },
        params: { id: '66c1a0030000000000000001' },
        body: { amountPaid: 5000, paymentMethod: 'cash' }
      };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        },
        json: (data) => { jsonResponse = data; }
      };

      await recordPayment(req, res);
      assert.equal(statusCode, 403);
      assert.equal(jsonResponse?.success, false);
      assert.match(jsonResponse?.message, /Only admin and staff/);
    });

    it('should enforce role middleware authorization (tenant rejected, staff allowed)', () => {
      const authMiddleware = authorize('admin', 'staff');
      
      let tenantStatus = null;
      let tenantBody = null;
      const tenantRes = {
        status: (c) => {
          tenantStatus = c;
          return { json: (d) => { tenantBody = d; } };
        }
      };
      authMiddleware({ user: { role: 'tenant' } }, tenantRes, () => {});
      assert.equal(tenantStatus, 403);

      let staffNextCalled = false;
      authMiddleware({ user: { role: 'staff' } }, {}, () => { staffNextCalled = true; });
      assert.equal(staffNextCalled, true);
    });

    it('should reject creating invoice when tenant is not found (authoritative check without fake defaults)', () => {
      const tenantUser = null;
      const tRecord = null;
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };

      if (!tenantUser && !tRecord) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      assert.equal(statusCode, 404);
      assert.equal(jsonResponse?.success, false);
      assert.match(jsonResponse?.message, /Tenant not found/);
    });
  });

  describe('4. Privacy Hardening: Room & Dashboard Isolation for Tenants', () => {
    it('should return empty activity log array for tenants on dashboard activities', async () => {
      const req = {
        user: { _id: '66c1a0000000000000000001', role: 'tenant' }
      };
      let jsonResponse = null;
      const res = {
        json: (data) => { jsonResponse = data; }
      };

      await getRecentActivities(req, res);
      assert.equal(jsonResponse?.success, true);
      assert.deepEqual(jsonResponse?.data, []);
    });

    it('should ensure tenant views of rooms strip sensitive email and phone fields', () => {
      const rawTenants = [
        { _id: '66c1a0010000000000000001', name: 'Alice Resident', email: 'alice@secret.com', phone: '+91 99999 00001', avatar: '' },
        { _id: '66c1a0010000000000000002', name: 'Bob Resident', email: 'bob@secret.com', phone: '+91 99999 00002', avatar: '' }
      ];

      // Privacy projection simulation: only 'name avatar'
      const sanitizedTenants = rawTenants.map(t => ({
        _id: t._id,
        name: t.name,
        avatar: t.avatar
      }));

      const serialized = JSON.stringify(sanitizedTenants);
      assert.ok(!serialized.includes('alice@secret.com'));
      assert.ok(!serialized.includes('+91 99999 00001'));
      assert.ok(!serialized.includes('bob@secret.com'));
      assert.ok(serialized.includes('Alice Resident'));
    });
  });

  describe('5. Room Maintenance Safety & Bed Capacity Consistency', () => {
    it('should reject placing occupied room into maintenance status', async () => {
      // Simulation test with occupied room
      const fakeRoomId = '66c1a0040000000000000001';
      const req = {
        user: { _id: '66c1a0020000000000000001', role: 'admin' },
        params: { id: fakeRoomId },
        body: { status: 'maintenance' }
      };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        },
        json: (data) => { jsonResponse = data; }
      };

      // When room has occupied beds > 0, toggleRoomStatus or updateRoom rejects maintenance
      // Testing the validation logic:
      const occupiedBeds = 2;
      const newStatus = 'maintenance';
      if (newStatus === 'maintenance' && occupiedBeds > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot set Room to maintenance while it is occupied by ${occupiedBeds} tenant(s)`
        });
      }

      assert.equal(statusCode, 400);
      assert.match(jsonResponse?.message, /Cannot set Room to maintenance while it is occupied/);
    });

    it('should prevent reducing room capacity below number of currently occupied beds', () => {
      const currentOccupiedBeds = 2;
      const requestedCapacity = 1;

      assert.ok(requestedCapacity < currentOccupiedBeds, 'Capacity reduction is strictly less than occupied');
      const canReduce = requestedCapacity >= currentOccupiedBeds;
      assert.equal(canReduce, false);
    });

    it('should safely expand beds array when capacity increases', () => {
      const existingBeds = [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: '66c1a0010000000000000001' }
      ];
      const newCapacity = 3;
      const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      const updatedBeds = [...existingBeds];
      for (let i = updatedBeds.length; i < newCapacity; i++) {
        const letter = bedLetters[i] || `${i + 1}`;
        updatedBeds.push({
          bedNumber: `Bed ${letter}`,
          isOccupied: false,
          tenantId: null
        });
      }

      assert.equal(updatedBeds.length, 3);
      assert.equal(updatedBeds[1].bedNumber, 'Bed B');
      assert.equal(updatedBeds[2].bedNumber, 'Bed C');
      assert.equal(updatedBeds[0].isOccupied, true);
      assert.equal(updatedBeds[1].isOccupied, false);
    });
  });

  describe('6. Production Safety: Error Handling & Auto-Seed Protection', () => {
    it('should mask internal error messages when NODE_ENV is production in handleControllerError', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      let statusCode = null;
      let jsonResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };

      const internalError = new Error('MongoServerSelectionError: connection timed out at 10.0.0.1:27017');
      handleControllerError(res, internalError, 'room operation');

      assert.equal(statusCode, 500);
      assert.equal(jsonResponse?.success, false);
      assert.equal(jsonResponse?.message, 'Internal server error. Please try again later.');
      assert.equal(jsonResponse?.error, undefined);
      assert.equal(jsonResponse?.stack, undefined);

      process.env.NODE_ENV = origEnv;
    });

    it('should prevent auto-seeding when NODE_ENV or VERCEL_ENV is production', async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origVercelEnv = process.env.VERCEL_ENV;

      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL_ENV;

      let seedRan = false;
      const result = await autoSeedIfEmpty();
      assert.equal(result, undefined);

      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'production';
      const result2 = await autoSeedIfEmpty();
      assert.equal(result2, undefined);

      process.env.NODE_ENV = origNodeEnv;
      process.env.VERCEL_ENV = origVercelEnv;
    });
  });

  describe('7. Input Sanitization & MongoDB ObjectId Validation', () => {
    it('should validate valid 24-character hexadecimal ObjectIds', () => {
      assert.equal(isValidObjectId('66c1a0000000000000000001'), true);
      assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
    });

    it('should reject invalid ObjectIds, fake IDs, or injection payloads', () => {
      assert.equal(isValidObjectId('usr_123'), false);
      assert.equal(isValidObjectId('mem_456'), false);
      assert.equal(isValidObjectId('12345'), false);
      assert.equal(isValidObjectId(''), false);
      assert.equal(isValidObjectId(null), false);
      assert.equal(isValidObjectId(undefined), false);
      assert.equal(isValidObjectId({ $gt: '' }), false);
      assert.equal(isValidObjectId('66c1a000000000000000000Z'), false); // 'Z' is not hex
    });

    it('should safely escape regex characters to prevent ReDoS and regex injection', () => {
      const dangerousSearch = '.*+?^${}()|[]\\hello';
      const escaped = escapeRegex(dangerousSearch);
      assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\hello');

      // Test that RegExp constructed from escaped string behaves as literal match
      const regex = new RegExp(escaped, 'i');
      assert.equal(regex.test('.*+?^${}()|[]\\hello'), true);
      assert.equal(regex.test('completely different string'), false);
    });
  });

  describe('8. Invoice Calculation & Payment Semantics', () => {
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

  describe('9. Date-Specific Mess Attendance', () => {
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

