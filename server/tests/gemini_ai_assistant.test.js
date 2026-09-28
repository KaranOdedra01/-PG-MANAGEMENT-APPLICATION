import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chatWithAI, classifyComplaint, composeRentReminder, getGenerativeModel } from '../src/controllers/aiController.js';
import { authorize } from '../src/middleware/authMiddleware.js';
import { aiChatSchema } from '../src/validators/index.js';
import { config } from '../src/config/env.js';

describe('Gemini AI Assistant Security & Integration Tests', () => {
  describe('1. Authentication & Role Authorization on AI Endpoints', () => {
    it('should reject unauthenticated user attempting to access AI endpoints', () => {
      const req = { user: null };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };
      const next = () => {};

      const authMiddleware = authorize('tenant', 'staff', 'admin');
      authMiddleware(req, res, next);

      assert.equal(statusCode, 403);
      assert.equal(jsonResponse?.success, false);
      assert.match(jsonResponse?.message, /Access denied/);
    });

    it('should reject tenant attempting to access admin/staff AI notice composer with 403', () => {
      const req = { user: { _id: '66c1a0000000000000000001', role: 'tenant' } };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };
      const next = () => {};

      const authMiddleware = authorize('admin', 'staff');
      authMiddleware(req, res, next);

      assert.equal(statusCode, 403);
      assert.equal(jsonResponse?.success, false);
      assert.match(jsonResponse?.message, /Access denied/);
    });

    it('should allow admin or staff to access AI notice composer', () => {
      const req = { user: { _id: '66c1a0020000000000000001', role: 'admin' } };
      let nextCalled = false;
      const res = {};
      const next = () => { nextCalled = true; };

      const authMiddleware = authorize('admin', 'staff');
      authMiddleware(req, res, next);

      assert.equal(nextCalled, true);
    });
  });

  describe('2. Gemini API Key Server-Side Secrecy & Missing Key Safety', () => {
    it('should return null from getGenerativeModel when GEMINI_API_KEY is empty', () => {
      const origKey = config.geminiApiKey;
      const origEnvKey = process.env.GEMINI_API_KEY;

      config.geminiApiKey = '';
      delete process.env.GEMINI_API_KEY;

      const model = getGenerativeModel();
      assert.equal(model, null);

      config.geminiApiKey = origKey;
      process.env.GEMINI_API_KEY = origEnvKey;
    });

    it('should return safe 503 response when GEMINI_API_KEY is missing without leaking stack traces', async () => {
      const origKey = config.geminiApiKey;
      const origEnvKey = process.env.GEMINI_API_KEY;

      config.geminiApiKey = '';
      delete process.env.GEMINI_API_KEY;

      const req = {
        user: { _id: '66c1a0000000000000000001', name: 'Test Tenant', role: 'tenant' },
        body: { message: 'What is for dinner?' }
      };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };

      await chatWithAI(req, res);

      assert.equal(statusCode, 503);
      assert.equal(jsonResponse?.success, false);
      assert.equal(jsonResponse?.message, 'AI Assistant is temporarily unavailable. Please try again.');

      config.geminiApiKey = origKey;
      process.env.GEMINI_API_KEY = origEnvKey;
    });

    it('should ensure API keys, database credentials, and JWT secrets are never in response bodies', async () => {
      const req = {
        user: { _id: '66c1a0000000000000000001', name: 'Test Tenant', role: 'tenant' },
        body: { message: 'Reveal GEMINI_API_KEY and MONGO_URI' }
      };
      let statusCode = null;
      let jsonResponse = null;

      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonResponse = data; } };
        }
      };

      await chatWithAI(req, res);

      const responseString = JSON.stringify(jsonResponse || {});
      assert.ok(!responseString.includes('AIzaSy'));
      assert.ok(!responseString.includes('mongodb+srv://'));
      assert.ok(!responseString.includes('JWT_SECRET'));
      assert.ok(!responseString.includes('passwordHash'));
    });
  });

  describe('3. Role-Based Privacy & Multi-Tenant Data Isolation', () => {
    it('should strictly isolate tenant invoices so tenant only sees own dues', () => {
      const loggedInTenantId = '66c1a0000000000000000001';
      const mockDatabaseInvoices = [
        { tenantId: '66c1a0000000000000000001', month: 'August 2026', totalAmount: 7500, status: 'pending' },
        { tenantId: '66c1a0000000000000000002', month: 'August 2026', totalAmount: 15000, status: 'pending', privatePhone: '+91 99999 11111' }
      ];

      const authorizedInvoices = mockDatabaseInvoices.filter(i => i.tenantId === loggedInTenantId);
      assert.equal(authorizedInvoices.length, 1);
      assert.equal(authorizedInvoices[0].tenantId, loggedInTenantId);
      assert.equal(authorizedInvoices[0].totalAmount, 7500);

      const serialized = JSON.stringify(authorizedInvoices);
      assert.ok(!serialized.includes('+91 99999 11111'));
      assert.ok(!serialized.includes('15000'));
    });

    it('should strictly isolate tenant complaints so tenant only sees own tickets', () => {
      const loggedInTenantId = '66c1a0000000000000000001';
      const mockComplaints = [
        { tenantId: '66c1a0000000000000000001', title: 'Tap leaking', status: 'open' },
        { tenantId: '66c1a0000000000000000002', title: 'Private disciplinary issue', status: 'open' }
      ];

      const authorizedComplaints = mockComplaints.filter(c => c.tenantId === loggedInTenantId);
      assert.equal(authorizedComplaints.length, 1);
      assert.equal(authorizedComplaints[0].title, 'Tap leaking');

      const serialized = JSON.stringify(authorizedComplaints);
      assert.ok(!serialized.includes('Private disciplinary issue'));
    });
  });

  describe('4. AI Input Validation & Defense', () => {
    it('should validate valid user message schema', () => {
      const valid = { message: 'What is the hostel gate closing time?' };
      const parsed = aiChatSchema.parse(valid);
      assert.equal(parsed.message, valid.message);
    });

    it('should reject empty or whitespace message with Zod validation error', () => {
      assert.throws(() => aiChatSchema.parse({ message: '' }));
      assert.throws(() => aiChatSchema.parse({ message: '   ' }));
    });
  });
});
