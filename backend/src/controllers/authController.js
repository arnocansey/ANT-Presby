const crypto = require('crypto');
const { comparePassword, hashPassword, sanitizeUser, apiResponse } = require('../utils/helpers');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} = require('../middleware/authMiddleware');
const userModel = require('../models/userModel');
const { sendEmailVerification } = require('../services/emailService');

const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const getCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const getVerificationAppBaseUrl = () =>
  process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const buildVerificationUrl = (token) =>
  `${getVerificationAppBaseUrl().replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

const createVerificationToken = () => crypto.randomBytes(32).toString('hex');

const setAuthCookies = (res, accessToken, refreshToken) => {
  const base = getCookieBaseOptions();

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

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

const sendVerificationForUser = async (user, token) => {
  await sendEmailVerification({
    email: user.email,
    firstName: user.first_name || user.firstName || 'there',
    verificationUrl: buildVerificationUrl(token),
  });
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
    const verificationToken = createVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

    const user = await userModel.createUser(email, hashedPassword, firstName, lastName, phone, {
      emailVerified: false,
      token: verificationToken,
      expiresAt: verificationExpiresAt,
      verifiedAt: null,
    });

    await sendVerificationForUser(user, verificationToken);

    res.status(201).json(
      apiResponse(
        true,
        {
          email: user.email,
          verification_required: true,
        },
        'Registration successful. Please check your email to verify your account.'
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

    if (!user.email_verified) {
      return res
        .status(403)
        .json(apiResponse(false, null, 'Please verify your email before signing in.'));
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

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(apiResponse(false, null, 'Verification token is required'));
    }

    const user = await userModel.findUserByVerificationToken(token);

    if (!user) {
      return res.status(400).json(apiResponse(false, null, 'Verification link is invalid'));
    }

    if (user.email_verified) {
      return res.json(apiResponse(true, { email: user.email }, 'Email already verified'));
    }

    if (!user.email_verification_expires_at || new Date(user.email_verification_expires_at) < new Date()) {
      return res.status(400).json(apiResponse(false, null, 'Verification link has expired'));
    }

    const verifiedUser = await userModel.markEmailVerified(user.id);

    res.json(
      apiResponse(
        true,
        {
          email: verifiedUser?.email || user.email,
        },
        'Email verified successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(apiResponse(false, null, 'Email is required'));
    }

    const user = await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(404).json(apiResponse(false, null, 'Account not found'));
    }

    if (user.email_verified) {
      return res.status(400).json(apiResponse(false, null, 'Email is already verified'));
    }

    const verificationToken = createVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

    await userModel.updateUser(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiresAt,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    await sendVerificationForUser(user, verificationToken);

    res.json(
      apiResponse(
        true,
        {
          email: user.email,
          verification_required: true,
        },
        'Verification email sent successfully'
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
  verifyEmail,
  resendVerificationEmail,
  logout,
  getCurrentUser,
  refreshToken,
};
