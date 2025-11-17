// middleware/verifyKitchen.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const verifyKitchen = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is kitchen or admin
    if (user.role !== 'kitchen' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Kitchen or Admin only.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Verify kitchen middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message,
    });
  }
};