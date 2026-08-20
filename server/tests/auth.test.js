import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { protect, authorize } from '../src/middleware/authMiddleware.js';

const TEST_SECRET = 'dev_secret_pg_jwt_key_2026';

describe('Authentication & Authorization Security Tests', () => {
  describe('JWT Security', () => {
    it('should generate a signed JWT with role and user id', () => {
      const payload = { id: '66c1a0010000000000000001', role: 'admin' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

      const decoded = jwt.verify(token, TEST_SECRET);
      assert.equal(decoded.id, payload.id);
      assert.equal(decoded.role, 'admin');
    });

    it('should reject tampered JWT token', () => {
      const payload = { id: '66c1a0010000000000000002', role: 'tenant' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
      const tampered = token.slice(0, -5) + 'AAAAA';

      assert.throws(() => jwt.verify(tampered, TEST_SECRET));
    });

    it('should reject expired JWT token', () => {
      const payload = { id: '66c1a0010000000000000002', role: 'tenant' };
      const expiredToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

      assert.throws(() => jwt.verify(expiredToken, TEST_SECRET));
    });
  });

  describe('Password Security (bcrypt)', () => {
    it('should hash password and not store plain text', async () => {
      const plain = 'Password@123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plain, salt);

      assert.notEqual(hash, plain);
      assert.ok(hash.startsWith('$2'));

      const isMatch = await bcrypt.compare(plain, hash);
      assert.equal(isMatch, true);

      const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
      assert.equal(isWrongMatch, false);
    });
  });

  describe('Role-Based Authorization Middleware', () => {
    it('should allow user with authorized role to proceed', () => {
      const req = { user: { _id: '123', role: 'admin' } };
      let nextCalled = false;
      const res = {};
      const next = () => { nextCalled = true; };

      const authMiddleware = authorize('admin', 'staff');
      authMiddleware(req, res, next);

      assert.equal(nextCalled, true);
    });

    it('should reject tenant attempting to access admin-only resource with 403', () => {
      const req = { user: { _id: '456', role: 'tenant' } };
      let statusCode = null;
      let jsonResponse = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => { jsonResponse = data; }
          };
        }
      };
      const next = () => { nextCalled = true; };

      const authMiddleware = authorize('admin');
      authMiddleware(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(statusCode, 403);
      assert.equal(jsonResponse?.success, false);
      assert.match(jsonResponse?.message, /Access denied/);
    });
  });
});
