// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.isAuth = false;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.isAuth = true;
      req.userId = decoded.userId;
      next();
    } catch (err) {
      req.isAuth = false;
      next();
    }
  } catch (err) {
    req.isAuth = false;
    next();
  }
};

module.exports = auth;