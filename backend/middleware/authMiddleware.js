const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'railtogether_hackathon_super_secure_jwt_secret_key_2026');

      if (decoded.id && User.findById) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch (e) {
          req.user = { _id: decoded.id, name: decoded.name || 'Demo User', email: decoded.email || 'demo@railtogether.app' };
        }
      }
      if (!req.user) {
        req.user = { _id: decoded.id || 'demo_user_id', name: decoded.name || 'Demo User', email: decoded.email || 'demo@railtogether.app' };
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  // If hackathon demo mode or no token, allow seamless fallback if requested with guest flag or header
  if (req.headers['x-guest-mode'] === 'true' || req.query.demo === 'true') {
    req.user = { _id: 'guest_hackathon_user', name: 'Hackathon Guest', email: 'guest@railtogether.app' };
    return next();
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
