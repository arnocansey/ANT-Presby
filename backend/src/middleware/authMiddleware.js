const jwt = require('jsonwebtoken');

const ACCESS_COOKIE = process.env.ACCESS_TOKEN_COOKIE_NAME || 'access_token';
const REFRESH_COOKIE = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refresh_token';

const extractAccessToken = (req) => {
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('Bearer ')) {
    return bearer.slice(7);
  }

  return req.cookies?.[ACCESS_COOKIE] || req.cookies?.token || null;
};

const verifyToken = (req, res, next) => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isAuthenticated = verifyToken;

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

const buildPayload = (userId, email, role, firstName, lastName) => ({
  userId,
  email,
  role,
  firstName,
  lastName,
});

const generateAccessToken = (userId, email, role, firstName, lastName) => {
  return jwt.sign(
    buildPayload(userId, email, role, firstName, lastName),
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '15m' }
  );
};

const generateRefreshToken = (userId, email, role, firstName, lastName) => {
  return jwt.sign(
    buildPayload(userId, email, role, firstName, lastName),
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '30d' }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

module.exports = {
  verifyToken,
  requireRole,
  isAuthenticated,
  generateToken: generateAccessToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
};
