import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Complaint from '../models/Complaint.js';
import Notice from '../models/Notice.js';
import { MessMenu, MealSubscription } from '../models/Mess.js';
import Visitor from '../models/Visitor.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg_management';

export const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name);

    // 1. Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Room.deleteMany({});
    await Tenant.deleteMany({});
    await Invoice.deleteMany({});
    await Expense.deleteMany({});
    await Complaint.deleteMany({});
    await Notice.deleteMany({});
    await MessMenu.deleteMany({});
    await MealSubscription.deleteMany({});
    await Visitor.deleteMany({});
    await ActivityLog.deleteMany({});

    // 2. Hash default password
    const defaultPassword = 'Password@123';

    // 3. Create Users
    console.log('👥 Creating Users...');
    const adminUser = await User.create({
      name: 'Karan Admin',
      email: 'admin@pg.com',
      password: defaultPassword,
      role: 'admin',
      phone: '+91 98765 43210',
      emergencyContact: { name: 'Emergency Admin', phone: '+91 99999 88888', relation: 'Partner' }
    });

    const staffUser = await User.create({
      name: 'Ramesh Caretaker',
      email: 'staff@pg.com',
      password: defaultPassword,
      role: 'staff',
      phone: '+91 98333 44455',
      emergencyContact: { name: 'Geeta', phone: '+91 98333 77777', relation: 'Spouse' }
    });

    const tenant1User = await User.create({
      name: 'Rahul Sharma',
      email: 'tenant@pg.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98111 22233',
      emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' }
    });

    const tenant2User = await User.create({
      name: 'Priya Patel',
      email: 'priya@gmail.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98222 33445',
      emergencyContact: { name: 'Dinesh Patel', phone: '+91 98222 88888', relation: 'Father' }
    });

    const tenant3User = await User.create({
      name: 'Aman Verma',
      email: 'aman@gmail.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98444 55667',
      emergencyContact: { name: 'Sanjay Verma', phone: '+91 98444 99999', relation: 'Brother' }
    });

    // 4. Create Rooms
    console.log('🛏️ Creating Rooms & Beds...');
    const room101 = await Room.create({
      roomNumber: '101',
      floor: 1,
      type: 'single',
      capacity: 1,
      occupiedBeds: 1,
      rent: 9500,
      status: 'occupied',
      amenities: ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Balcony', 'Study Table'],
      beds: [{ bedNumber: 'Bed A', isOccupied: true, tenantId: tenant2User._id }],
      tenants: [tenant2User._id]
    });

    const room102 = await Room.create({
      roomNumber: '102',
      floor: 1,
      type: 'double',
      capacity: 2,
      occupiedBeds: 2,
      rent: 7500,
      status: 'occupied',
      amenities: ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Wardrobe'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: tenant1User._id },
        { bedNumber: 'Bed B', isOccupied: true, tenantId: tenant3User._id }
      ],
      tenants: [tenant1User._id, tenant3User._id]
    });

    const room201 = await Room.create({
      roomNumber: '201',
      floor: 2,
      type: 'double',
      capacity: 2,
      occupiedBeds: 0,
      rent: 7000,
      status: 'available',
      amenities: ['Non-AC', 'Attached Bathroom', 'High-Speed WiFi', 'Wardrobe'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null }
      ],
      tenants: []
    });

    const room202 = await Room.create({
      roomNumber: '202',
      floor: 2,
      type: 'triple',
      capacity: 3,
      occupiedBeds: 0,
      rent: 5500,
      status: 'available',
      amenities: ['AC', 'Attached Bathroom', 'WiFi', 'Balcony'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed C', isOccupied: false, tenantId: null }
      ],
      tenants: []
    });

    const room203 = await Room.create({
      roomNumber: '203',
      floor: 2,
      type: 'single',
      capacity: 1,
      occupiedBeds: 0,
      rent: 9000,
      status: 'maintenance',
      amenities: ['AC', 'Attached Bath', 'WiFi'],
      beds: [{ bedNumber: 'Bed A', isOccupied: false, tenantId: null }],
      tenants: []
    });

    const room301 = await Room.create({
      roomNumber: '301',
      floor: 3,
      type: 'dormitory',
      capacity: 4,
      occupiedBeds: 0,
      rent: 4500,
      status: 'available',
      amenities: ['Fan', 'Common Bath', 'WiFi', 'Individual Lockers'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed C', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed D', isOccupied: false, tenantId: null }
      ],
      tenants: []
    });

    // 5. Update user room references
    tenant1User.roomId = room102._id;
    tenant1User.roomNumber = '102';
    await tenant1User.save();

    tenant2User.roomId = room101._id;
    tenant2User.roomNumber = '101';
    await tenant2User.save();

    tenant3User.roomId = room102._id;
    tenant3User.roomNumber = '102';
    await tenant3User.save();

    // 6. Create Tenants
    console.log('📋 Creating Active Tenants...');
    const t1 = await Tenant.create({
      userId: tenant1User._id,
      roomId: room102._id,
      roomNumber: '102',
      bedNumber: 'Bed A',
      name: tenant1User.name,
      email: tenant1User.email,
      phone: tenant1User.phone,
      checkInDate: new Date('2026-02-10'),
      securityDeposit: 15000,
      monthlyRent: 7500,
      idProofType: 'Aadhaar',
      idProofNumber: 'XXXX-XXXX-4812',
      emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' },
      status: 'active'
    });

    const t2 = await Tenant.create({
      userId: tenant2User._id,
      roomId: room101._id,
      roomNumber: '101',
      bedNumber: 'Bed A',
      name: tenant2User.name,
      email: tenant2User.email,
      phone: tenant2User.phone,
      checkInDate: new Date('2026-03-01'),
      securityDeposit: 19000,
      monthlyRent: 9500,
      idProofType: 'College ID',
      idProofNumber: 'GUJ-2024-889',
      emergencyContact: { name: 'Dinesh Patel', phone: '+91 98222 88888', relation: 'Father' },
      status: 'active'
    });

    const t3 = await Tenant.create({
      userId: tenant3User._id,
      roomId: room102._id,
      roomNumber: '102',
      bedNumber: 'Bed B',
      name: tenant3User.name,
      email: tenant3User.email,
      phone: tenant3User.phone,
      checkInDate: new Date('2026-04-12'),
      securityDeposit: 15000,
      monthlyRent: 7500,
      idProofType: 'Aadhaar',
      idProofNumber: 'XXXX-XXXX-9921',
      emergencyContact: { name: 'Sanjay Verma', phone: '+91 98444 99999', relation: 'Brother' },
      status: 'active'
    });

    // 7. Create Invoices
    console.log('💳 Creating Invoices...');
    await Invoice.create({
      tenantId: tenant1User._id,
      tenantName: tenant1User.name,
      roomNumber: '102',
      month: 'August 2026',
      baseRent: 7500,
      electricityCharge: 450,
      maintenanceFee: 200,
      messFee: 0,
      totalAmount: 8150,
      status: 'paid',
      dueDate: new Date('2026-08-05'),
      paidDate: new Date('2026-08-03'),
      paymentMode: 'UPI',
      transactionId: 'UPI-AUG-102938'
    });

    await Invoice.create({
      tenantId: tenant2User._id,
      tenantName: tenant2User.name,
      roomNumber: '101',
      month: 'August 2026',
      baseRent: 9500,
      electricityCharge: 600,
      maintenanceFee: 200,
      messFee: 0,
      totalAmount: 10300,
      status: 'paid',
      dueDate: new Date('2026-08-05'),
      paidDate: new Date('2026-08-04'),
      paymentMode: 'Bank Transfer',
      transactionId: 'NEFT-88392019'
    });

    await Invoice.create({
      tenantId: tenant3User._id,
      tenantName: tenant3User.name,
      roomNumber: '102',
      month: 'August 2026',
      baseRent: 7500,
      electricityCharge: 450,
      maintenanceFee: 200,
      messFee: 0,
      totalAmount: 8150,
      status: 'pending',
      dueDate: new Date('2026-08-10'),
      paidDate: null,
      paymentMode: 'Pending'
    });

    // 8. Create Operating Expenses
    console.log('💰 Creating Operating Expenses...');
    await Expense.create({
      category: 'electricity',
      amount: 14200,
      description: 'Main Building Electricity Bill (Torrent Power) - July',
      date: new Date('2026-08-02'),
      paymentMode: 'Bank Transfer',
      receiptRef: 'EB-2026-07-889',
      addedBy: 'Karan Admin'
    });

    await Expense.create({
      category: 'salary',
      amount: 18000,
      description: 'Staff & Caretaker monthly salary',
      date: new Date('2026-08-01'),
      paymentMode: 'Bank Transfer',
      receiptRef: 'SAL-AUG-01',
      addedBy: 'Karan Admin'
    });

    await Expense.create({
      category: 'water',
      amount: 3200,
      description: 'Water filtration & RO membrane replacement',
      date: new Date('2026-08-10'),
      paymentMode: 'UPI',
      receiptRef: 'RO-FLT-2026',
      addedBy: 'Karan Admin'
    });

    // 9. Create Complaints
    console.log('🛠️ Creating Complaints...');
    await Complaint.create({
      tenantId: tenant1User._id,
      tenantName: tenant1User.name,
      roomNumber: '102',
      title: 'AC cooling issue in Room 102',
      description: 'The split AC is blowing normal room air and not cooling properly.',
      category: 'electrical',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'Suresh Electrician',
      assignedAt: new Date('2026-08-18T11:00:00'),
      resolutionNote: 'Inspecting gas level and capacitor'
    });

    await Complaint.create({
      tenantId: tenant2User._id,
      tenantName: tenant2User.name,
      roomNumber: '101',
      title: 'WiFi signal dropping in evening',
      description: 'WiFi speed on 1st floor drops below 2 Mbps around 9 PM.',
      category: 'internet',
      priority: 'medium',
      status: 'open',
      assignedTo: 'Unassigned'
    });

    // 10. Create Notices
    console.log('📢 Creating Notices...');
    await Notice.create({
      title: 'Water Tank Cleaning Scheduled for Saturday',
      content: 'Please note that water supply will be suspended between 10:00 AM to 1:00 PM on Saturday for routine overhead tank sanitation.',
      category: 'maintenance',
      priority: 'high',
      postedBy: 'Karan Admin',
      isPinned: true,
      targetRoles: ['all']
    });

    await Notice.create({
      title: 'Independence Day Special Dinner at Mess',
      content: 'Special Punjabi Thali & Sweet dish will be served for all residents on August 15th from 8:00 PM onwards.',
      category: 'events',
      priority: 'medium',
      postedBy: 'Karan Admin',
      isPinned: false,
      targetRoles: ['all']
    });

    // 11. Create 7-day Mess Menu
    console.log('🍽️ Creating Mess Menus...');
    const weeklyMenu = [
      {
        day: 'Monday',
        breakfast: 'Poha, Boiled Eggs / Banana, Tea/Coffee',
        lunch: 'Dal Makhani, Mix Veg, Roti, Jeera Rice, Curd',
        snacks: 'Veg Sandwich & Ginger Chai',
        dinner: 'Aloo Gobi, Chana Dal, Chapati, Steamed Rice, Gulab Jamun',
        specialNote: 'Dessert Included'
      },
      {
        day: 'Tuesday',
        breakfast: 'Aloo Paratha with Curd & Pickle, Tea',
        lunch: 'Rajma Masala, Aloo Shimla Mirch, Roti, Basmati Rice, Salad',
        snacks: 'Samosa with Green & Tamarind Chutney',
        dinner: 'Kadhai Paneer / Egg Curry, Tarka Dal, Roti, Rice',
        specialNote: 'Special Paneer Day'
      },
      {
        day: 'Wednesday',
        breakfast: 'Idli Sambar & Coconut Chutney, Filter Coffee',
        lunch: 'Chole Masala, Bhature / Puri, Jeera Rice, Boondi Raita',
        snacks: 'White Sauce Pasta & Cold Coffee',
        dinner: 'Soyabean Curry, Moong Dal, Roti, Rice, Kheer',
        specialNote: 'South Indian Breakfast'
      },
      {
        day: 'Thursday',
        breakfast: 'Methi Thepla, Chhundo / Pickle, Masala Chai',
        lunch: 'Kadhi Pakoda, Aloo Bhindi Fry, Steamed Rice, Roti',
        snacks: 'Bhel Puri & Lemon Iced Tea',
        dinner: 'Matar Paneer, Yellow Dal Tadka, Butter Roti, Pulao',
        specialNote: 'Light Gujarati Lunch'
      },
      {
        day: 'Friday',
        breakfast: 'Bread Omelette / Veg Cheese Toast, Tea/Coffee',
        lunch: 'Dal Fry, Sev Tameta Nu Shaak, Rice, Phulka Roti, Salad',
        snacks: 'Vada Pav with Fried Green Chillies',
        dinner: 'Veg Biryani / Chicken Biryani, Veg Raita, Salan, Ice Cream',
        specialNote: 'Biryani Night'
      },
      {
        day: 'Saturday',
        breakfast: 'Masala Dosa with Sambhar & Red Chutney',
        lunch: 'Baingan Bharta, Gujarati Dal, Steamed Rice, Roti, Buttermilk',
        snacks: 'French Fries & Chai',
        dinner: 'Pav Bhaji with Extra Butter Pav, Pulav, Sweet Lassi',
        specialNote: 'Street Food Saturday'
      },
      {
        day: 'Sunday',
        breakfast: 'Poori Bhaji / Chana Poori, Halwa, Special Tea',
        lunch: 'Dum Aloo Kashmiri, Dal Tadka, Ghee Rice, Roti, Roasted Papad',
        snacks: 'Pakodas & Masala Chai',
        dinner: 'Paneer Butter Masala, Butter Naan, Veg Pulao, Rasgulla',
        specialNote: 'Sunday Feast'
      }
    ];

    for (const m of weeklyMenu) {
      await MessMenu.create(m);
    }

    // 12. Create Meal Subscriptions
    await MealSubscription.create({
      userId: tenant1User._id,
      plan: 'full',
      monthlyCharge: 3500,
      diet: 'Vegetarian',
      attendance: { breakfast: true, lunch: true, dinner: true }
    });

    await MealSubscription.create({
      userId: tenant2User._id,
      plan: 'full',
      monthlyCharge: 3500,
      diet: 'Vegetarian',
      attendance: { breakfast: true, lunch: true, dinner: true }
    });

    await MealSubscription.create({
      userId: tenant3User._id,
      plan: '2-meal',
      monthlyCharge: 2800,
      diet: 'Eggetarian',
      attendance: { breakfast: true, lunch: false, dinner: true }
    });

    // 13. Create Visitors
    console.log('🚪 Creating Visitor Logs...');
    await Visitor.create({
      name: 'Sunil Sharma',
      phone: '+91 98111 99999',
      visitorType: 'Family',
      tenantId: tenant1User._id,
      tenantName: 'Rahul Sharma',
      roomNumber: '102',
      purpose: 'Parents visiting for the weekend',
      vehicleNumber: 'GJ-01-AB-1234',
      entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      exitTime: null,
      status: 'inside',
      loggedBy: 'Ramesh Caretaker'
    });

    await Visitor.create({
      name: 'Zomato Delivery Agent',
      phone: '+91 98777 44433',
      visitorType: 'Delivery',
      tenantId: tenant2User._id,
      tenantName: 'Priya Patel',
      roomNumber: '101',
      purpose: 'Food delivery parcel handover at gate',
      vehicleNumber: 'GJ-01-XX-9900',
      entryTime: new Date(Date.now() - 45 * 60 * 1000),
      exitTime: new Date(Date.now() - 35 * 60 * 1000),
      status: 'checked-out',
      loggedBy: 'Security Guard'
    });

    // 14. Create Activity Logs
    console.log('📊 Creating Activity Logs...');
    await ActivityLog.create({
      actor: { userId: adminUser._id, name: adminUser.name, role: 'admin' },
      action: 'SYSTEM_INIT',
      entity: 'System',
      description: 'PG Management System initialized with real MongoDB database',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    await ActivityLog.create({
      actor: { userId: adminUser._id, name: adminUser.name, role: 'admin' },
      action: 'ONBOARD_TENANT',
      entity: 'Tenant',
      description: 'Onboarded tenant Rahul Sharma into Room 102 (Bed A)',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    await ActivityLog.create({
      actor: { userId: tenant1User._id, name: tenant1User.name, role: 'tenant' },
      action: 'RECORD_PAYMENT',
      entity: 'Invoice',
      description: 'Rahul Sharma paid ₹8,150 for August 2026 Rent via UPI',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    console.log('\n=============================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('Default Accounts:');
    console.log('👑 Admin:  admin@pg.com  / Password@123');
    console.log('🛠️ Staff:  staff@pg.com  / Password@123');
    console.log('🎓 Tenant: tenant@pg.com / Password@123');
    console.log('🎓 Tenant: priya@gmail.com / Password@123');
    console.log('🎓 Tenant: aman@gmail.com / Password@123');
    console.log('=============================================\n');

    if (process.env.NODE_ENV !== 'test') {
      await mongoose.disconnect();
    }
    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
