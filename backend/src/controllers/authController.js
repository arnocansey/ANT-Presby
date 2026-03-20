const { comparePassword, hashPassword, sanitizeUser, apiResponse } = require('../utils/helpers');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} = require('../middleware/authMiddleware');
const userModel = require('../models/userModel');

const getCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  const base = getCookieBaseOptions();

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  // Backward compatibility for any clients still reading the old token cookie name.
  res.cookie('token', accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const base = getCookieBaseOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
  res.clearCookie('token', base);
};

const buildTokensForUser = (user) => {
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role,
    user.first_name,
    user.last_name
  );

  const refreshToken = generateRefreshToken(
    user.id,
    user.email,
    user.role,
    user.first_name,
    user.last_name
  );

  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, acceptedTerms } = req.body;

    if (acceptedTerms !== true) {
      return res.status(400).json(apiResponse(false, null, 'You must accept the terms and agreement'));
    }

    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json(apiResponse(false, null, 'Email already registered'));
    }

    const hashedPassword = await hashPassword(password);

    const user = await userModel.createUser(
      email,
      hashedPassword,
      firstName,
      lastName,
      phone
    );

    const { accessToken, refreshToken } = buildTokensForUser(user);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json(
      apiResponse(
        true,
        {
          user: sanitizeUser(user),
          token: accessToken,
        },
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json(apiResponse(false, null, 'Invalid credentials'));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(apiResponse(false, null, 'Invalid credentials'));
    }

    const { accessToken, refreshToken } = buildTokensForUser(user);
    setAuthCookies(res, accessToken, refreshToken);

    res.json(
      apiResponse(
        true,
        {
          user: sanitizeUser(user),
          token: accessToken,
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  clearAuthCookies(res);
  res.json(apiResponse(true, null, 'Logout successful'));
};

const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(apiResponse(false, null, 'Not authenticated'));
    }

    const user = await userModel.findUserById(req.user.userId);
    if (!user) {
      return res.status(401).json(apiResponse(false, null, 'User not found'));
    }

    res.json(apiResponse(true, sanitizeUser(user), 'User retrieved'));
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (!token) {
      return res.status(401).json(apiResponse(false, null, 'Refresh token required'));
    }

    const decoded = verifyRefreshToken(token);
    const user = await userModel.findUserById(decoded.userId);

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json(apiResponse(false, null, 'User not found'));
    }

    const { accessToken, refreshToken: newRefreshToken } = buildTokensForUser(user);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json(apiResponse(true, { token: accessToken }, 'Token refreshed'));
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json(apiResponse(false, null, 'Invalid or expired refresh token'));
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
};
