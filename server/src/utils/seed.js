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
import { MessMenu, MealSubscription, MealAttendance } from '../models/Mess.js';
import PGSettings from '../models/PGSettings.js';
import Visitor from '../models/Visitor.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg_management';

const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    await MealAttendance.deleteMany({});
    await PGSettings.deleteMany({});
    await Visitor.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});

    // 2. Hash default password
    const defaultPassword = 'Password@123';

    // 3. Seed PG Settings
    console.log('⚙️ Creating PG Settings...');
    await PGSettings.create({
      hostelName: 'Greenwood Executive PG & Student Living',
      address: 'Plot 42, Infocity Road, Gandhinagar, Gujarat - 382007',
      gateOpeningTime: '06:00 AM',
      gateClosingTime: '10:30 PM',
      visitingHoursStart: '10:00 AM',
      visitingHoursEnd: '08:00 PM',
      silentHoursStart: '11:00 PM',
      silentHoursEnd: '06:00 AM',
      wifiSsid: 'Greenwood_HighSpeed_Fiber_5G',
      wifiDetails: 'High-speed 300 Mbps fiber internet. Wi-Fi credentials are provided upon room assignment.',
      emergencyContacts: {
        police: '112',
        ambulance: '108',
        wardenPhone: '+91 98765 43210',
        nearestHospital: 'Apollo Hospital (1.2 km)'
      },
      generalRules: [
        'Main security gate closes strictly at 10:30 PM.',
        'Visitors must sign in at the gate and leave premises by 08:00 PM.',
        'Alcohol, smoking, and contraband items are strictly prohibited inside the hostel.',
        'Corridor silence hours (11:00 PM - 06:00 AM) must be maintained.',
        'Raise maintenance requests through the Resident Complaints portal.'
      ]
    });

    // 4. Create Users
    console.log('👥 Creating Users...');
    const adminUser = await User.create({
      name: 'Karan Admin',
      email: 'admin@pg.com',
      password: defaultPassword,
      role: 'admin',
      phone: '+91 98765 43210',
      mustChangePassword: false,
      emergencyContact: { name: 'Emergency Admin', phone: '+91 99999 88888', relation: 'Partner' }
    });

    const staffUser = await User.create({
      name: 'Ramesh Caretaker',
      email: 'staff@pg.com',
      password: defaultPassword,
      role: 'staff',
      phone: '+91 98333 44455',
      mustChangePassword: false,
      emergencyContact: { name: 'Geeta', phone: '+91 98333 77777', relation: 'Spouse' }
    });

    const tenant1User = await User.create({
      name: 'Rahul Sharma',
      email: 'tenant@pg.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98111 22233',
      mustChangePassword: false,
      emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' }
    });

    const tenant2User = await User.create({
      name: 'Priya Patel',
      email: 'priya@gmail.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98222 33445',
      mustChangePassword: false,
      emergencyContact: { name: 'Dinesh Patel', phone: '+91 98222 88888', relation: 'Father' }
    });

    const tenant3User = await User.create({
      name: 'Aman Verma',
      email: 'aman@gmail.com',
      password: defaultPassword,
      role: 'tenant',
      phone: '+91 98444 55667',
      mustChangePassword: false,
      emergencyContact: { name: 'Rajesh Verma', phone: '+91 98444 11111', relation: 'Father' }
    });

    // 5. Create Rooms with synchronized beds
    console.log('🛏️ Creating Rooms...');
    const room101 = await Room.create({
      roomNumber: '101',
      floor: 1,
      type: 'double',
      capacity: 2,
      occupiedBeds: 1,
      rent: 7500,
      status: 'available',
      amenities: ['Attached Bathroom', 'Air Conditioner', 'Study Desk', 'High-Speed Wi-Fi'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: tenant2User._id },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null }
      ],
      tenants: [tenant2User._id]
    });

    const room102 = await Room.create({
      roomNumber: '102',
      floor: 1,
      type: 'single',
      capacity: 1,
      occupiedBeds: 1,
      rent: 12000,
      status: 'occupied',
      amenities: ['Balcony', 'Air Conditioner', 'Attached Bathroom', 'Smart TV', 'Wi-Fi'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: tenant1User._id }
      ],
      tenants: [tenant1User._id]
    });

    const room201 = await Room.create({
      roomNumber: '201',
      floor: 2,
      type: 'triple',
      capacity: 3,
      occupiedBeds: 1,
      rent: 6000,
      status: 'available',
      amenities: ['Attached Washroom', 'Study Desks', 'Wi-Fi', 'Wardrobe'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: true, tenantId: tenant3User._id },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed C', isOccupied: false, tenantId: null }
      ],
      tenants: [tenant3User._id]
    });

    const room202 = await Room.create({
      roomNumber: '202',
      floor: 2,
      type: 'double',
      capacity: 2,
      occupiedBeds: 0,
      rent: 7000,
      status: 'available',
      amenities: ['Attached Bathroom', 'Air Conditioner', 'Wi-Fi'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null }
      ],
      tenants: []
    });

    const room301 = await Room.create({
      roomNumber: '301',
      floor: 3,
      type: 'dormitory',
      capacity: 4,
      occupiedBeds: 0,
      rent: 4500,
      status: 'maintenance',
      amenities: ['Locker', 'Common Bath', 'Fan', 'Wi-Fi'],
      beds: [
        { bedNumber: 'Bed A', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed B', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed C', isOccupied: false, tenantId: null },
        { bedNumber: 'Bed D', isOccupied: false, tenantId: null }
      ],
      tenants: []
    });

    // Link users with their allocated rooms
    tenant1User.roomId = room102._id;
    tenant1User.roomNumber = '102';
    await tenant1User.save();

    tenant2User.roomId = room101._id;
    tenant2User.roomNumber = '101';
    await tenant2User.save();

    tenant3User.roomId = room201._id;
    tenant3User.roomNumber = '201';
    await tenant3User.save();

    // 6. Create Tenants
    console.log('📋 Creating Tenants...');
    const tenant1 = await Tenant.create({
      userId: tenant1User._id,
      roomId: room102._id,
      roomNumber: '102',
      bedNumber: 'Bed A',
      name: tenant1User.name,
      email: tenant1User.email,
      phone: tenant1User.phone,
      checkInDate: new Date('2026-01-15'),
      securityDeposit: 12000,
      monthlyRent: 12000,
      idProofType: 'Aadhaar',
      idProofNumber: '8912-3456-7890',
      emergencyContact: tenant1User.emergencyContact,
      status: 'active',
      isActive: true
    });

    const tenant2 = await Tenant.create({
      userId: tenant2User._id,
      roomId: room101._id,
      roomNumber: '101',
      bedNumber: 'Bed A',
      name: tenant2User.name,
      email: tenant2User.email,
      phone: tenant2User.phone,
      checkInDate: new Date('2026-02-01'),
      securityDeposit: 10000,
      monthlyRent: 7500,
      idProofType: 'College ID',
      idProofNumber: 'DAIICT-2023-CS-042',
      emergencyContact: tenant2User.emergencyContact,
      status: 'active',
      isActive: true
    });

    const tenant3 = await Tenant.create({
      userId: tenant3User._id,
      roomId: room201._id,
      roomNumber: '201',
      bedNumber: 'Bed A',
      name: tenant3User.name,
      email: tenant3User.email,
      phone: tenant3User.phone,
      checkInDate: new Date('2026-03-10'),
      securityDeposit: 10000,
      monthlyRent: 6000,
      idProofType: 'Passport',
      idProofNumber: 'P7829103',
      emergencyContact: tenant3User.emergencyContact,
      status: 'active',
      isActive: true
    });

    // 7. Create Invoices
    console.log('💳 Creating Invoices...');
    await Invoice.create({
      tenantId: tenant1User._id,
      tenantName: tenant1User.name,
      roomNumber: '102',
      month: 'August 2026',
      baseRent: 12000,
      electricityCharge: 650,
      maintenanceFee: 200,
      messFee: 3500,
      discount: 0,
      lateFee: 0,
      totalAmount: 16350,
      status: 'paid',
      dueDate: new Date('2026-08-05'),
      paidDate: new Date('2026-08-03'),
      paymentMode: 'UPI',
      transactionId: 'UPI-8921-X992-01'
    });

    await Invoice.create({
      tenantId: tenant1User._id,
      tenantName: tenant1User.name,
      roomNumber: '102',
      month: 'September 2026',
      baseRent: 12000,
      electricityCharge: 550,
      maintenanceFee: 200,
      messFee: 3500,
      discount: 0,
      lateFee: 0,
      totalAmount: 16250,
      status: 'pending',
      dueDate: new Date('2026-09-05'),
      paidDate: null,
      paymentMode: 'Pending'
    });

    await Invoice.create({
      tenantId: tenant2User._id,
      tenantName: tenant2User.name,
      roomNumber: '101',
      month: 'August 2026',
      baseRent: 7500,
      electricityCharge: 450,
      maintenanceFee: 200,
      messFee: 3500,
      discount: 500,
      lateFee: 0,
      totalAmount: 11150,
      status: 'paid',
      dueDate: new Date('2026-08-05'),
      paidDate: new Date('2026-08-04'),
      paymentMode: 'Bank Transfer',
      transactionId: 'NEFT-AXIS-20260804'
    });

    await Invoice.create({
      tenantId: tenant3User._id,
      tenantName: tenant3User.name,
      roomNumber: '201',
      month: 'August 2026',
      baseRent: 6000,
      electricityCharge: 400,
      maintenanceFee: 200,
      messFee: 2800,
      discount: 0,
      lateFee: 250,
      totalAmount: 9650,
      status: 'overdue',
      dueDate: new Date('2026-08-05'),
      paidDate: null,
      paymentMode: 'Pending'
    });

    // 8. Create Expenses
    console.log('🧾 Creating Expenses...');
    await Expense.create({
      category: 'electricity',
      amount: 8500,
      description: 'Hostel Main Electric Meter Bill - UGVCL July-August',
      date: new Date('2026-08-02'),
      paymentMode: 'Bank Transfer',
      receiptRef: 'EBILL-881923',
      addedBy: 'Karan Admin'
    });

    await Expense.create({
      category: 'groceries',
      amount: 14200,
      description: 'Monthly ration, rice, pulses, and cooking oil for mess',
      date: new Date('2026-08-04'),
      paymentMode: 'UPI',
      receiptRef: 'DMART-2026-0804',
      addedBy: 'Ramesh Caretaker'
    });

    await Expense.create({
      category: 'internet',
      amount: 2499,
      description: 'Airtel Broadband 300 Mbps Multi-AP Plan',
      date: new Date('2026-08-01'),
      paymentMode: 'Bank Transfer',
      receiptRef: 'AIRTEL-BILL-0826',
      addedBy: 'Karan Admin'
    });

    await Expense.create({
      category: 'maintenance',
      amount: 1800,
      description: 'Plumber fees for fixing 2nd floor bathroom leakage',
      date: new Date('2026-08-08'),
      paymentMode: 'Cash',
      receiptRef: 'VOUCHER-044',
      addedBy: 'Ramesh Caretaker'
    });

    // 9. Create Complaints
    console.log('🔧 Creating Complaints...');
    await Complaint.create({
      tenantId: tenant1User._id,
      tenantName: tenant1User.name,
      roomNumber: '102',
      title: 'Geyser not heating properly',
      description: 'Bathroom geyser takes more than 30 minutes to warm up water. Needs heating element check.',
      category: 'electrical',
      priority: 'high',
      status: 'assigned',
      assignedTo: 'Ramesh Caretaker',
      assignedStaffId: staffUser._id,
      assignedAt: new Date()
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
        dinner: 'Veg Biryani / Paneer Biryani, Veg Raita, Salan, Ice Cream',
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

    // 12. Create Meal Subscriptions & Date-Specific Attendance
    console.log('🍲 Creating Meal Subscriptions & Attendance...');
    await MealSubscription.create({
      userId: tenant1User._id,
      plan: 'full',
      monthlyCharge: 3500,
      diet: 'Vegetarian',
      isActive: true
    });

    await MealSubscription.create({
      userId: tenant2User._id,
      plan: 'full',
      monthlyCharge: 3500,
      diet: 'Vegetarian',
      isActive: true
    });

    await MealSubscription.create({
      userId: tenant3User._id,
      plan: '2-meal',
      monthlyCharge: 2800,
      diet: 'Eggetarian',
      isActive: true
    });

    // Date-specific attendance for today & yesterday
    const todayStr = getTodayDateString(0);
    const yesterdayStr = getTodayDateString(-1);

    await MealAttendance.create([
      { userId: tenant1User._id, date: todayStr, breakfast: true, lunch: true, dinner: true },
      { userId: tenant2User._id, date: todayStr, breakfast: true, lunch: true, dinner: false },
      { userId: tenant3User._id, date: todayStr, breakfast: true, lunch: false, dinner: true },
      { userId: tenant1User._id, date: yesterdayStr, breakfast: true, lunch: true, dinner: true },
      { userId: tenant2User._id, date: yesterdayStr, breakfast: true, lunch: true, dinner: true },
      { userId: tenant3User._id, date: yesterdayStr, breakfast: true, lunch: false, dinner: true }
    ]);

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
      description: 'Rahul Sharma paid ₹16,350 for August 2026 Rent via UPI',
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
