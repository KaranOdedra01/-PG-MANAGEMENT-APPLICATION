import express from 'express';
import { register, login, getMe, getDemoAccounts, createPrivilegedUser } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, createUserSchema } from '../validators/index.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/users', protect, authorize('admin'), validate(createUserSchema), createPrivilegedUser);
router.get('/me', protect, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
