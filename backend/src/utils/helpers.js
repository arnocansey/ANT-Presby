const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Hash password using bcryptjs
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate UUID
 */
const generateId = () => uuidv4();

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
  return new Date(date).toISOString();
};

/**
 * Parse pagination parameters
 */
const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, offset };
};

/**
 * Build pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const totalPages = Math.ceil(total / limitNum);

  return {
    current_page: pageNum,
    per_page: limitNum,
    total,
    total_pages: totalPages,
    has_more: pageNum < totalPages,
  };
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize user object (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
};

/**
 * Build API response
 */
const apiResponse = (success, data, message = '', meta = null) => {
  const response = {
    success,
    data,
    message,
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Check if user has required permissions
 */
const hasPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

/**
 * Build where clause for database queries
 */
const buildWhereClause = (filters) => {
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex += 1;
    }
  });

  return {
    clause: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    params,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateId,
  formatDate,
  getPagination,
  buildPaginationMeta,
  isValidEmail,
  sanitizeUser,
  apiResponse,
  hasPermission,
  buildWhereClause,
};

