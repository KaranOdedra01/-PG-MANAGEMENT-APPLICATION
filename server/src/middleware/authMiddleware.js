import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET is not configured in production environment');
        }
      }

      const decoded = jwt.verify(token, secret || 'dev_secret_pg_jwt_key_2026');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized: User account no longer exists' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized: Account is deactivated' 
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Session expired, please login again' 
        });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized: Invalid token' 
      });
    }
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Not authorized: No token provided' 
  });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
      });
    }
    next();
  };
};
