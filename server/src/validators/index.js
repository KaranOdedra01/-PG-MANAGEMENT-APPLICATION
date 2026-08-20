import { z } from 'zod';

// Reusable custom validators
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const zObjectId = z.string().refine((val) => objectIdRegex.test(val) || val.startsWith('usr_') || val.startsWith('mem_') || val.startsWith('room_'), {
  message: 'Invalid ID format'
});

// AUTH
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().default(''),
  emergencyContact: z.object({
    name: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    relation: z.string().optional().default('')
  }).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff', 'tenant']),
  phone: z.string().optional().default(''),
  emergencyContact: z.object({
    name: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    relation: z.string().optional().default('')
  }).optional()
});

// ROOMS
export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  floor: z.coerce.number().min(0, 'Floor must be 0 or higher'),
  type: z.enum(['single', 'double', 'triple', 'dormitory']),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  rent: z.coerce.number().min(0, 'Rent cannot be negative'),
  amenities: z.array(z.string()).optional().default([])
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).trim().optional(),
  floor: z.coerce.number().min(0).optional(),
  type: z.enum(['single', 'double', 'triple', 'dormitory']).optional(),
  capacity: z.coerce.number().min(1).optional(),
  rent: z.coerce.number().min(0).optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  amenities: z.array(z.string()).optional()
});

export const toggleRoomStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'maintenance'])
});

// TENANTS
export const onboardTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name is required').trim(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required').trim(),
  roomId: z.string().min(1, 'Target room is required'),
  password: z.string().min(6).optional().default('Password@123'),
  securityDeposit: z.coerce.number().min(0).optional().default(10000),
  idProofType: z.enum(['Aadhaar', 'Passport', 'Driving License', 'College ID', 'Voter ID', 'Other']).optional().default('Aadhaar'),
  idProofNumber: z.string().optional().default(''),
  checkInDate: z.string().or(z.date()).optional(),
  emergencyContact: z.object({
    name: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    relation: z.string().optional().default('')
  }).optional()
});

export const updateTenantSchema = z.object({
  phone: z.string().optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
  idProofType: z.enum(['Aadhaar', 'Passport', 'Driving License', 'College ID', 'Voter ID', 'Other']).optional(),
  idProofNumber: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relation: z.string().optional()
  }).optional(),
  status: z.enum(['active', 'notice-period', 'checked-out']).optional()
});

// INVOICES
export const createInvoiceSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  month: z.string().min(1, 'Month is required'),
  baseRent: z.coerce.number().min(0, 'Base rent cannot be negative'),
  electricityCharge: z.coerce.number().min(0).optional().default(0),
  maintenanceFee: z.coerce.number().min(0).optional().default(0),
  messFee: z.coerce.number().min(0).optional().default(0),
  lateFee: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  dueDate: z.string().or(z.date())
});

export const generateMonthlyInvoicesSchema = z.object({
  month: z.string().optional().default('Current Month'),
  electricityCharge: z.coerce.number().min(0).optional().default(500),
  maintenanceFee: z.coerce.number().min(0).optional().default(200),
  messFee: z.coerce.number().min(0).optional().default(0),
  dueDate: z.string().or(z.date()).optional()
});

export const recordPaymentSchema = z.object({
  paymentMode: z.enum(['UPI', 'Bank Transfer', 'Cash', 'Cheque', 'Card', 'Pending']).optional().default('UPI'),
  transactionId: z.string().optional().default('')
});

// EXPENSES
export const createExpenseSchema = z.object({
  category: z.enum(['electricity', 'water', 'salary', 'maintenance', 'internet', 'groceries', 'cleaning', 'repairs', 'other']),
  amount: z.coerce.number().min(0, 'Expense amount cannot be negative'),
  description: z.string().min(1, 'Description is required').trim(),
  date: z.string().or(z.date()).optional(),
  paymentMode: z.enum(['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card']).optional().default('Bank Transfer'),
  receiptRef: z.string().optional().default('')
});

export const updateExpenseSchema = z.object({
  category: z.enum(['electricity', 'water', 'salary', 'maintenance', 'internet', 'groceries', 'cleaning', 'repairs', 'other']).optional(),
  amount: z.coerce.number().min(0).optional(),
  description: z.string().min(1).trim().optional(),
  date: z.string().or(z.date()).optional(),
  paymentMode: z.enum(['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card']).optional(),
  receiptRef: z.string().optional()
});

// COMPLAINTS
export const createComplaintSchema = z.object({
  title: z.string().min(2, 'Title is required').trim(),
  description: z.string().min(5, 'Detailed description is required').trim(),
  category: z.enum(['plumbing', 'electrical', 'cleaning', 'internet', 'security', 'carpentry', 'appliance', 'other']).optional().default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  roomNumber: z.string().optional(),
  attachments: z.array(z.string()).optional().default([])
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(['open', 'assigned', 'in-progress', 'waiting-for-parts', 'resolved', 'closed']),
  resolutionNote: z.string().optional().default(''),
  actualCost: z.coerce.number().min(0).optional()
});

export const assignComplaintSchema = z.object({
  assignedTo: z.string().min(1, 'Assignee name is required'),
  assignedStaffId: z.string().optional()
});

// NOTICES
export const createNoticeSchema = z.object({
  title: z.string().min(2, 'Title is required').trim(),
  content: z.string().min(5, 'Content is required').trim(),
  category: z.enum(['maintenance', 'rules', 'events', 'emergency', 'general']).optional().default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  targetRoles: z.array(z.enum(['all', 'tenant', 'staff', 'admin'])).optional().default(['all']),
  isPinned: z.boolean().optional().default(false)
});

export const updateNoticeSchema = z.object({
  title: z.string().min(2).trim().optional(),
  content: z.string().min(5).trim().optional(),
  category: z.enum(['maintenance', 'rules', 'events', 'emergency', 'general']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  targetRoles: z.array(z.enum(['all', 'tenant', 'staff', 'admin'])).optional(),
  isPinned: z.boolean().optional()
});

// VISITORS
export const checkinVisitorSchema = z.object({
  name: z.string().min(2, 'Visitor name is required').trim(),
  phone: z.string().min(5, 'Phone number is required').trim(),
  visitorType: z.enum(['Family', 'Friend', 'Delivery', 'Maintenance', 'Official', 'Other']).optional().default('Friend'),
  tenantName: z.string().optional(),
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  purpose: z.string().optional().default('Casual Visit'),
  vehicleNumber: z.string().optional().default('')
});

// MESS
export const updateMessMenuSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  breakfast: z.string().min(1, 'Breakfast menu is required'),
  lunch: z.string().min(1, 'Lunch menu is required'),
  snacks: z.string().min(1, 'Snacks menu is required'),
  dinner: z.string().min(1, 'Dinner menu is required'),
  specialNote: z.string().optional().default('')
});

export const toggleMealAttendanceSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner'])
});

export const updateMealPlanSchema = z.object({
  plan: z.enum(['full', '2-meal', 'none']),
  diet: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain']).optional()
});

// AI
export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').trim(),
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string().optional(),
    text: z.string().optional(),
    sender: z.string().optional()
  })).optional().default([])
});

export const aiClassifyComplaintSchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().min(3, 'Description is required').trim()
});

export const aiComposeReminderSchema = z.object({
  tenantName: z.string().optional(),
  roomNumber: z.string().optional(),
  amount: z.coerce.number().optional(),
  month: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  tone: z.string().optional().default('polite')
});
