import bcrypt from 'bcryptjs';

const hashedDefaultPassword = bcrypt.hashSync('Password@123', 10);

export const inMemoryUsers = [
  {
    _id: '66c1a0010000000000000001',
    name: 'Karan Admin',
    email: 'admin@pg.com',
    password: hashedDefaultPassword,
    role: 'admin',
    phone: '+91 98765 43210',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminKaran',
    isActive: true,
    emergencyContact: { name: 'Emergency Admin', phone: '+91 99999 88888', relation: 'Partner' },
    createdAt: new Date('2026-01-01')
  },
  {
    _id: '66c1a0010000000000000002',
    name: 'Rahul Sharma',
    email: 'tenant@pg.com',
    password: hashedDefaultPassword,
    role: 'tenant',
    phone: '+91 98111 22233',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulTenant',
    roomId: '66c1b0010000000000000002',
    roomNumber: '102',
    isActive: true,
    emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' },
    createdAt: new Date('2026-02-10')
  },
  {
    _id: '66c1a0010000000000000003',
    name: 'Ramesh Caretaker',
    email: 'staff@pg.com',
    password: hashedDefaultPassword,
    role: 'staff',
    phone: '+91 98333 44455',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RameshStaff',
    isActive: true,
    emergencyContact: { name: 'Geeta', phone: '+91 98333 77777', relation: 'Spouse' },
    createdAt: new Date('2026-01-15')
  },
  {
    _id: '66c1a0010000000000000004',
    name: 'Priya Patel',
    email: 'priya@gmail.com',
    password: hashedDefaultPassword,
    role: 'tenant',
    phone: '+91 98222 33445',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaPatel',
    roomId: '66c1b0010000000000000001',
    roomNumber: '101',
    isActive: true,
    emergencyContact: { name: 'Dinesh Patel', phone: '+91 98222 88888', relation: 'Father' },
    createdAt: new Date('2026-03-01')
  },
  {
    _id: '66c1a0010000000000000005',
    name: 'Aman Verma',
    email: 'aman@gmail.com',
    password: hashedDefaultPassword,
    role: 'tenant',
    phone: '+91 98444 55667',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanVerma',
    roomId: '66c1b0010000000000000002',
    roomNumber: '102',
    isActive: true,
    emergencyContact: { name: 'Sanjay Verma', phone: '+91 98444 99999', relation: 'Brother' },
    createdAt: new Date('2026-04-12')
  }
];

export const inMemoryRooms = [
  {
    _id: '66c1b0010000000000000001',
    roomNumber: '101',
    floor: 1,
    type: 'single',
    capacity: 1,
    occupiedBeds: 1,
    rent: 9500,
    status: 'occupied',
    amenities: ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Balcony', 'Study Table'],
    tenants: ['66c1a0010000000000000004']
  },
  {
    _id: '66c1b0010000000000000002',
    roomNumber: '102',
    floor: 1,
    type: 'double',
    capacity: 2,
    occupiedBeds: 2,
    rent: 7500,
    status: 'occupied',
    amenities: ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Wardrobe'],
    tenants: ['66c1a0010000000000000002', '66c1a0010000000000000005']
  },
  {
    _id: '66c1b0010000000000000003',
    roomNumber: '201',
    floor: 2,
    type: 'double',
    capacity: 2,
    occupiedBeds: 1,
    rent: 7000,
    status: 'available',
    amenities: ['Non-AC', 'Attached Bathroom', 'High-Speed WiFi', 'Wardrobe'],
    tenants: []
  },
  {
    _id: '66c1b0010000000000000004',
    roomNumber: '202',
    floor: 2,
    type: 'triple',
    capacity: 3,
    occupiedBeds: 2,
    rent: 5500,
    status: 'available',
    amenities: ['AC', 'Attached Bathroom', 'WiFi', 'Balcony'],
    tenants: []
  },
  {
    _id: '66c1b0010000000000000005',
    roomNumber: '203',
    floor: 2,
    type: 'single',
    capacity: 1,
    occupiedBeds: 0,
    rent: 9000,
    status: 'maintenance',
    amenities: ['AC', 'Attached Bath', 'WiFi'],
    tenants: []
  }
];

export const inMemoryInvoices = [
  {
    _id: '66c1c0010000000000000001',
    tenantId: '66c1a0010000000000000002',
    tenantName: 'Rahul Sharma',
    roomNumber: '102',
    month: 'August 2026',
    baseRent: 7500,
    electricityCharge: 450,
    maintenanceFee: 200,
    totalAmount: 8150,
    status: 'paid',
    dueDate: new Date('2026-08-05'),
    paidDate: new Date('2026-08-03'),
    paymentMode: 'UPI'
  },
  {
    _id: '66c1c0010000000000000002',
    tenantId: '66c1a0010000000000000004',
    tenantName: 'Priya Patel',
    roomNumber: '101',
    month: 'August 2026',
    baseRent: 9500,
    electricityCharge: 600,
    maintenanceFee: 200,
    totalAmount: 10300,
    status: 'paid',
    dueDate: new Date('2026-08-05'),
    paidDate: new Date('2026-08-04'),
    paymentMode: 'Bank Transfer'
  },
  {
    _id: '66c1c0010000000000000003',
    tenantId: '66c1a0010000000000000005',
    tenantName: 'Aman Verma',
    roomNumber: '102',
    month: 'August 2026',
    baseRent: 7500,
    electricityCharge: 450,
    maintenanceFee: 200,
    totalAmount: 8150,
    status: 'pending',
    dueDate: new Date('2026-08-05'),
    paidDate: null,
    paymentMode: 'Pending'
  }
];

export const inMemoryComplaints = [
  {
    _id: '66c1d0010000000000000001',
    tenantId: '66c1a0010000000000000002',
    tenantName: 'Rahul Sharma',
    roomNumber: '102',
    title: 'AC cooling issue in Room 102',
    description: 'The split AC is blowing normal air and not cooling properly since yesterday night.',
    category: 'electrical',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'Ramesh Caretaker',
    createdAt: new Date('2026-08-18T10:30:00')
  },
  {
    _id: '66c1d0010000000000000002',
    tenantId: '66c1a0010000000000000004',
    tenantName: 'Priya Patel',
    roomNumber: '101',
    title: 'WiFi connection dropping intermittently',
    description: 'WiFi speed on 1st floor drops below 2 Mbps during evening hours.',
    category: 'internet',
    priority: 'medium',
    status: 'open',
    assignedTo: 'Unassigned',
    createdAt: new Date('2026-08-19T08:15:00')
  }
];

export const inMemoryNotices = [
  {
    _id: '66c1e0010000000000000001',
    title: 'Water Tank Cleaning Scheduled for Saturday',
    content: 'Please note that water supply will be suspended between 10:00 AM to 1:00 PM on Saturday for routine overhead tank sanitation.',
    category: 'maintenance',
    postedBy: 'Karan Admin',
    createdAt: new Date('2026-08-17T09:00:00'),
    priority: 'high'
  },
  {
    _id: '66c1e0010000000000000002',
    title: 'Independence Day Special Dinner at Mess',
    content: 'Special Punjabi Thali & Sweet dish will be served for all residents on August 15th from 8:00 PM onwards.',
    category: 'events',
    postedBy: 'Karan Admin',
    createdAt: new Date('2026-08-14T11:00:00'),
    priority: 'medium'
  }
];

export const inMemoryExpenses = [
  {
    _id: '66c1f0010000000000000001',
    category: 'electricity',
    amount: 14200,
    description: 'Main Building Electricity Bill (Torrent Power) - July',
    date: new Date('2026-08-02')
  },
  {
    _id: '66c1f0010000000000000002',
    category: 'salary',
    amount: 18000,
    description: 'Staff & Caretaker monthly salary',
    date: new Date('2026-08-01')
  },
  {
    _id: '66c1f0010000000000000003',
    category: 'water',
    amount: 3200,
    description: 'Water filtration & RO filter replacement',
    date: new Date('2026-08-10')
  }
];
