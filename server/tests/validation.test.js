import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  createUserSchema,
  createRoomSchema,
  updateRoomSchema,
  onboardTenantSchema,
  createInvoiceSchema,
  createExpenseSchema,
  createComplaintSchema,
  assignComplaintSchema,
  changePasswordSchema,
  createNoticeSchema,
  checkinVisitorSchema,
  aiChatSchema,
  zObjectId
} from '../src/validators/index.js';

describe('Validation Schemas (Zod)', () => {
  describe('Auth Validation', () => {
    it('should validate valid registration payload', () => {
      const valid = {
        name: 'Rahul Sharma',
        email: 'rahul@test.com',
        password: 'Password@123',
        phone: '+91 9876543210'
      };
      const result = registerSchema.parse(valid);
      assert.equal(result.email, 'rahul@test.com');
      assert.equal(result.name, 'Rahul Sharma');
    });

    it('should reject registration with invalid email', () => {
      const invalid = {
        name: 'Rahul Sharma',
        email: 'not-an-email',
        password: 'Password@123'
      };
      assert.throws(() => registerSchema.parse(invalid));
    });

    it('should reject registration with short password (< 6 chars)', () => {
      const invalid = {
        name: 'Rahul Sharma',
        email: 'rahul@test.com',
        password: '123'
      };
      assert.throws(() => registerSchema.parse(invalid));
    });

    it('should validate login credentials', () => {
      const valid = { email: 'admin@pg.com', password: 'Password@123' };
      const result = loginSchema.parse(valid);
      assert.equal(result.email, 'admin@pg.com');
    });

    it('should reject privileged user creation with invalid role', () => {
      const invalid = {
        name: 'Test Staff',
        email: 'staff@test.com',
        password: 'Password@123',
        role: 'superhero' // Invalid role
      };
      assert.throws(() => createUserSchema.parse(invalid));
    });
  });

  describe('Room Validation', () => {
    it('should validate valid room creation', () => {
      const valid = {
        roomNumber: '101',
        floor: 1,
        type: 'single',
        capacity: 1,
        rent: 9500,
        amenities: ['AC', 'WiFi']
      };
      const result = createRoomSchema.parse(valid);
      assert.equal(result.roomNumber, '101');
      assert.equal(result.capacity, 1);
      assert.equal(result.rent, 9500);
    });

    it('should reject room with negative rent', () => {
      const invalid = {
        roomNumber: '102',
        floor: 1,
        type: 'double',
        capacity: 2,
        rent: -500
      };
      assert.throws(() => createRoomSchema.parse(invalid));
    });

    it('should reject room with 0 capacity', () => {
      const invalid = {
        roomNumber: '103',
        floor: 1,
        type: 'single',
        capacity: 0,
        rent: 5000
      };
      assert.throws(() => createRoomSchema.parse(invalid));
    });

    it('should reject room with invalid room type', () => {
      const invalid = {
        roomNumber: '104',
        floor: 1,
        type: 'penthouse',
        capacity: 2,
        rent: 15000
      };
      assert.throws(() => createRoomSchema.parse(invalid));
    });
  });

  describe('Tenant Validation', () => {
    it('should validate valid tenant onboarding payload', () => {
      const valid = {
        name: 'Priya Patel',
        email: 'priya@test.com',
        phone: '+91 98222 33445',
        roomId: '66c1b0010000000000000001',
        securityDeposit: 15000,
        idProofType: 'Aadhaar'
      };
      const result = onboardTenantSchema.parse(valid);
      assert.equal(result.name, 'Priya Patel');
      assert.equal(result.securityDeposit, 15000);
    });

    it('should reject tenant with negative security deposit', () => {
      const invalid = {
        name: 'Priya Patel',
        email: 'priya@test.com',
        phone: '+91 98222 33445',
        roomId: '66c1b0010000000000000001',
        securityDeposit: -1000
      };
      assert.throws(() => onboardTenantSchema.parse(invalid));
    });
  });

  describe('Invoice Validation', () => {
    it('should validate invoice creation payload', () => {
      const valid = {
        tenantId: '66c1a0010000000000000002',
        month: 'August 2026',
        baseRent: 7500,
        electricityCharge: 450,
        maintenanceFee: 200,
        dueDate: '2026-08-10'
      };
      const result = createInvoiceSchema.parse(valid);
      assert.equal(result.baseRent, 7500);
      assert.equal(result.electricityCharge, 450);
    });

    it('should reject invoice with negative base rent', () => {
      const invalid = {
        tenantId: '66c1a0010000000000000002',
        month: 'August 2026',
        baseRent: -5000,
        dueDate: '2026-08-10'
      };
      assert.throws(() => createInvoiceSchema.parse(invalid));
    });
  });

  describe('Expense Validation', () => {
    it('should validate valid expense creation', () => {
      const valid = {
        category: 'electricity',
        amount: 14200,
        description: 'Monthly electricity bill'
      };
      const result = createExpenseSchema.parse(valid);
      assert.equal(result.category, 'electricity');
      assert.equal(result.amount, 14200);
    });

    it('should reject expense with invalid category', () => {
      const invalid = {
        category: 'cryptocurrency_mining',
        amount: 5000,
        description: 'Illegal expense'
      };
      assert.throws(() => createExpenseSchema.parse(invalid));
    });
  });

  describe('Complaint Validation', () => {
    it('should validate complaint creation', () => {
      const valid = {
        title: 'AC cooling issue',
        description: 'AC is blowing normal air and not cooling the room.',
        category: 'electrical',
        priority: 'high'
      };
      const result = createComplaintSchema.parse(valid);
      assert.equal(result.category, 'electrical');
      assert.equal(result.priority, 'high');
    });

    it('should reject complaint with too short description', () => {
      const invalid = {
        title: 'AC broken',
        description: 'bad' // < 5 characters
      };
      assert.throws(() => createComplaintSchema.parse(invalid));
    });
  });

  describe('Visitor Validation', () => {
    it('should validate visitor check-in', () => {
      const valid = {
        name: 'Sunil Sharma',
        phone: '+91 98111 99999',
        visitorType: 'Family',
        roomNumber: '102',
        purpose: 'Weekend visit'
      };
      const result = checkinVisitorSchema.parse(valid);
      assert.equal(result.name, 'Sunil Sharma');
      assert.equal(result.roomNumber, '102');
    });

    it('should reject visitor check-in without roomNumber', () => {
      const invalid = {
        name: 'Sunil Sharma',
        phone: '+91 98111 99999'
      };
      assert.throws(() => checkinVisitorSchema.parse(invalid));
    });
  });

  describe('ObjectId & Complaint Assignment Validation', () => {
    it('should accept valid 24-character hex MongoDB ObjectId', () => {
      const validId = '66c1a0010000000000000001';
      assert.doesNotThrow(() => zObjectId.parse(validId));
    });

    it('should reject fake prefixed IDs like usr_123 or mem_456', () => {
      assert.throws(() => zObjectId.parse('usr_123'));
      assert.throws(() => zObjectId.parse('mem_456'));
      assert.throws(() => zObjectId.parse('room_789'));
    });

    it('should validate assignComplaintSchema with valid assignedStaffId', () => {
      const valid = { assignedStaffId: '66c1a0010000000000000001' };
      const parsed = assignComplaintSchema.parse(valid);
      assert.equal(parsed.assignedStaffId, valid.assignedStaffId);
    });

    it('should reject assignComplaintSchema with invalid or missing assignedStaffId', () => {
      assert.throws(() => assignComplaintSchema.parse({}));
      assert.throws(() => assignComplaintSchema.parse({ assignedStaffId: 'invalid-id' }));
    });
  });

  describe('AI Validation', () => {
    it('should validate AI chat request', () => {
      const valid = {
        message: 'What is today lunch menu?',
        conversationHistory: []
      };
      const result = aiChatSchema.parse(valid);
      assert.equal(result.message, 'What is today lunch menu?');
    });

    it('should reject empty AI message', () => {
      const invalid = { message: '' };
      assert.throws(() => aiChatSchema.parse(invalid));
    });
  });
});
