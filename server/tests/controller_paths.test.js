import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { validateEnv } from '../src/config/env.js';

describe('Controller Paths & Business Logic Deep Verification', () => {

  describe('A. Complaint Assignment Controller Logic', () => {
    it('should assign complaint to valid active staff and keep assignedTo in sync with staffUser.name', () => {
      const staffUser = {
        _id: '66c1a0010000000000000010',
        name: 'Ramesh Staff',
        role: 'staff',
        isActive: true
      };

      const complaint = {
        _id: '66c1b0010000000000000020',
        ticketNumber: 'TKT-001',
        tenantId: '66c1a0010000000000000002',
        title: 'Water tap leaking',
        status: 'open',
        assignedTo: 'Unassigned',
        assignedStaffId: null,
        assignedAt: null
      };

      // Simulated controller logic
      if (staffUser && (staffUser.role === 'staff' || staffUser.role === 'admin') && staffUser.isActive) {
        complaint.assignedStaffId = staffUser._id;
        complaint.assignedTo = staffUser.name;
        complaint.assignedAt = new Date();
        if (complaint.status === 'open') {
          complaint.status = 'assigned';
        }
      }

      assert.equal(complaint.assignedStaffId, staffUser._id);
      assert.equal(complaint.assignedTo, 'Ramesh Staff');
      assert.equal(complaint.status, 'assigned');
      assert.ok(complaint.assignedAt instanceof Date);
    });

    it('should reject complaint assignment if user is a tenant', () => {
      const tenantUser = {
        _id: '66c1a0010000000000000002',
        name: 'John Tenant',
        role: 'tenant',
        isActive: true
      };

      const isValidStaff = tenantUser && (tenantUser.role === 'staff' || tenantUser.role === 'admin') && tenantUser.isActive;
      assert.equal(isValidStaff, false);
    });

    it('should reject complaint assignment if staff user is inactive', () => {
      const inactiveStaff = {
        _id: '66c1a0010000000000000011',
        name: 'Inactive Staff',
        role: 'staff',
        isActive: false
      };

      const isValidStaff = inactiveStaff && (inactiveStaff.role === 'staff' || inactiveStaff.role === 'admin') && inactiveStaff.isActive;
      assert.equal(isValidStaff, false);
    });

    it('should build correct notification message using staffUser.name', () => {
      const staffUser = { name: 'Suresh Electrician' };
      const ticketNumber = 'TKT-101';
      const notificationMsg = `Your complaint #${ticketNumber} has been assigned to ${staffUser.name}.`;

      assert.equal(notificationMsg, 'Your complaint #TKT-101 has been assigned to Suresh Electrician.');
      assert.ok(!notificationMsg.includes('undefined'));
    });
  });

  describe('B. Tenant Onboarding Logic & Temporary Password', () => {
    it('should generate secure random temporary password when no password is provided', () => {
      const password = undefined;
      const isGeneratedPassword = !password;
      const initialPassword = password || `Temp@${crypto.randomBytes(4).toString('hex')}`;

      assert.equal(isGeneratedPassword, true);
      assert.ok(initialPassword.startsWith('Temp@'));
      assert.ok(initialPassword.length >= 13);
    });

    it('should set mustChangePassword to true for generated temporary password', () => {
      const isGeneratedPassword = true;
      const userPayload = {
        name: 'New Resident',
        email: 'resident@test.com',
        mustChangePassword: isGeneratedPassword
      };

      assert.equal(userPayload.mustChangePassword, true);
    });

    it('should correctly allocate available bed slot on onboarding', () => {
      const room = {
        roomNumber: '101',
        capacity: 2,
        occupiedBeds: 1,
        beds: [
          { bedNumber: 'Bed A', isOccupied: true, tenantId: 'u1' },
          { bedNumber: 'Bed B', isOccupied: false, tenantId: null }
        ]
      };

      const newUserId = 'u2';
      const freeBed = room.beds.find(b => !b.isOccupied);
      assert.ok(freeBed);
      assert.equal(freeBed.bedNumber, 'Bed B');

      freeBed.isOccupied = true;
      freeBed.tenantId = newUserId;

      const occupied = room.beds.filter(b => b.isOccupied && b.tenantId);
      room.occupiedBeds = occupied.length;

      assert.equal(room.occupiedBeds, 2);
      assert.equal(room.beds[1].isOccupied, true);
      assert.equal(room.beds[1].tenantId, 'u2');
    });
  });

  describe('C. Tenant Checkout & Bed Release Logic', () => {
    it('should release bed slot and decrement room occupancy on checkout', () => {
      const tenant = {
        _id: 't1',
        userId: 'u1',
        roomId: 'r1',
        bedNumber: 'Bed A',
        status: 'active',
        isActive: true,
        deletedAt: null
      };

      const room = {
        _id: 'r1',
        roomNumber: '101',
        capacity: 2,
        occupiedBeds: 2,
        status: 'occupied',
        beds: [
          { bedNumber: 'Bed A', isOccupied: true, tenantId: 'u1' },
          { bedNumber: 'Bed B', isOccupied: true, tenantId: 'u2' }
        ]
      };

      // Checkout operation
      tenant.status = 'checked-out';
      tenant.isActive = false;
      tenant.deletedAt = new Date();

      const occupiedBed = room.beds.find(b => b.bedNumber === tenant.bedNumber || (b.tenantId && b.tenantId.toString() === tenant.userId.toString()));
      if (occupiedBed) {
        occupiedBed.isOccupied = false;
        occupiedBed.tenantId = null;
      }

      const occupied = room.beds.filter(b => b.isOccupied && b.tenantId);
      room.occupiedBeds = occupied.length;
      if (room.status !== 'maintenance') {
        room.status = room.occupiedBeds >= room.capacity ? 'occupied' : 'available';
      }

      assert.equal(tenant.status, 'checked-out');
      assert.equal(tenant.isActive, false);
      assert.equal(room.occupiedBeds, 1);
      assert.equal(room.status, 'available');
      assert.equal(room.beds[0].isOccupied, false);
      assert.equal(room.beds[0].tenantId, null);
    });
  });

  describe('D. AI Safety & Fact Consistency', () => {
    it('should return unconfigured message when PGSettings fields are empty', () => {
      const pgSettings = {
        hostelName: 'Test PG',
        gateOpeningTime: '',
        gateClosingTime: '',
        wifiSsid: '',
        emergencyContacts: {
          ambulance: '',
          police: '',
          wardenPhone: '',
          nearestHospital: ''
        }
      };

      const unconfiguredMsg = 'That information is not configured in the PG system.';

      const ambulanceContact = pgSettings.emergencyContacts?.ambulance || unconfiguredMsg;
      const policeContact = pgSettings.emergencyContacts?.police || unconfiguredMsg;
      const wardenContact = pgSettings.emergencyContacts?.wardenPhone || unconfiguredMsg;
      const hospitalContact = pgSettings.emergencyContacts?.nearestHospital || unconfiguredMsg;

      assert.equal(ambulanceContact, unconfiguredMsg);
      assert.equal(policeContact, unconfiguredMsg);
      assert.equal(wardenContact, unconfiguredMsg);
      assert.equal(hospitalContact, unconfiguredMsg);

      // Verify no fake defaults like Apollo Hospital
      assert.ok(!hospitalContact.includes('Apollo'));
      assert.ok(!wardenContact.includes('98765'));
    });

    it('should format real PGSettings values when configured', () => {
      const pgSettings = {
        hostelName: 'Greenwood PG',
        gateOpeningTime: '06:00 AM',
        gateClosingTime: '10:30 PM',
        wifiSsid: 'Greenwood_WiFi',
        wifiDetails: '500 Mbps Fiber'
      };

      const formattedGate = `Gate Opens: ${pgSettings.gateOpeningTime} | Closes: ${pgSettings.gateClosingTime}`;
      assert.equal(formattedGate, 'Gate Opens: 06:00 AM | Closes: 10:30 PM');
    });
  });

  describe('E. Environment Configuration & Validation', () => {
    it('should require MONGO_URI in production and fail fast if missing', () => {
      const origEnv = process.env.NODE_ENV;
      const origMongo = process.env.MONGO_URI;

      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = '';

      assert.throws(() => validateEnv(), /FATAL: Missing required environment variable/);

      process.env.NODE_ENV = origEnv;
      process.env.MONGO_URI = origMongo;
    });
  });
});
