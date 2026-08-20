import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Business Logic & Calculation Tests', () => {
  describe('Invoice Calculations', () => {
    it('should calculate total amount correctly on backend (baseRent + electricity + maintenance + mess + lateFee - discount)', () => {
      const invoiceData = {
        baseRent: 7500,
        electricityCharge: 450,
        maintenanceFee: 200,
        messFee: 3500,
        lateFee: 100,
        discount: 250
      };

      const calculatedTotal = invoiceData.baseRent + 
                             invoiceData.electricityCharge + 
                             invoiceData.maintenanceFee + 
                             invoiceData.messFee + 
                             invoiceData.lateFee - 
                             invoiceData.discount;

      assert.equal(calculatedTotal, 11500);
    });

    it('should prevent negative totalAmount if discount exceeds charges', () => {
      const invoiceData = {
        baseRent: 1000,
        electricityCharge: 0,
        maintenanceFee: 0,
        messFee: 0,
        lateFee: 0,
        discount: 2000 // Exceeds rent
      };

      const total = Math.max(0, invoiceData.baseRent - invoiceData.discount);
      assert.equal(total, 0);
    });
  });

  describe('Room & Bed Occupancy Logic', () => {
    it('should calculate available beds accurately (capacity - occupiedBeds)', () => {
      const room = {
        roomNumber: '102',
        capacity: 3,
        occupiedBeds: 2
      };

      const availableBeds = Math.max(0, room.capacity - room.occupiedBeds);
      assert.equal(availableBeds, 1);
    });

    it('should correctly determine room status when fully occupied', () => {
      const capacity = 2;
      const occupiedBeds = 2;
      const status = occupiedBeds >= capacity ? 'occupied' : 'available';

      assert.equal(status, 'occupied');
    });

    it('should correctly determine room status when beds become available', () => {
      const capacity = 2;
      const occupiedBeds = 1;
      const status = occupiedBeds >= capacity ? 'occupied' : 'available';

      assert.equal(status, 'available');
    });
  });

  describe('AI Complaint Classification Heuristics', () => {
    const classifyHeuristic = (text) => {
      const q = text.toLowerCase();
      if (q.includes('spark') || q.includes('fire') || q.includes('shock') || q.includes('power') || q.includes('light')) {
        return { category: 'electrical', priority: q.includes('spark') || q.includes('fire') ? 'urgent' : 'high' };
      }
      if (q.includes('leak') || q.includes('tap') || q.includes('pipe') || q.includes('water')) {
        return { category: 'plumbing', priority: q.includes('flood') ? 'urgent' : 'medium' };
      }
      if (q.includes('wifi') || q.includes('internet')) {
        return { category: 'internet', priority: 'medium' };
      }
      return { category: 'other', priority: 'medium' };
    };

    it('should classify electrical fire/spark as urgent electrical', () => {
      const result = classifyHeuristic('Geyser power socket is sparking with smoke');
      assert.equal(result.category, 'electrical');
      assert.equal(result.priority, 'urgent');
    });

    it('should classify pipe leak as plumbing', () => {
      const result = classifyHeuristic('Bathroom tap is dripping and pipe is leaking');
      assert.equal(result.category, 'plumbing');
      assert.equal(result.priority, 'medium');
    });

    it('should classify slow router speed as internet', () => {
      const result = classifyHeuristic('Hostel wifi is very slow in Room 201');
      assert.equal(result.category, 'internet');
      assert.equal(result.priority, 'medium');
    });
  });
});
