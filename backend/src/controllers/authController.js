const crypto = require('crypto');
const axios = require('axios');
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
const GOOGLE_STATE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MOBILE_SCHEME = process.env.MOBILE_APP_SCHEME || 'antpressmobile';

const getCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const getVerificationAppBaseUrl = () =>
  process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const getGoogleCallbackBaseUrl = () =>
  process.env.BACKEND_PUBLIC_URL || process.env.API_BASE_URL || 'http://localhost:5000';

const getGoogleCallbackUrl = () =>
  `${getGoogleCallbackBaseUrl().replace(/\/$/, '')}/api/auth/google/callback`;

const buildVerificationUrl = (token) =>
  `${getVerificationAppBaseUrl().replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

const buildFrontendGoogleCallbackUrl = () =>
  `${getVerificationAppBaseUrl().replace(/\/$/, '')}/oauth/google/callback`;

const createVerificationToken = () => crypto.randomBytes(32).toString('hex');

const createGoogleStateToken = (payload) => {
  const data = {
    ...payload,
    nonce: crypto.randomBytes(12).toString('hex'),
    exp: Date.now() + GOOGLE_STATE_WINDOW_MS,
  };

  return Buffer.from(JSON.stringify(data)).toString('base64url');
};

const parseGoogleStateToken = (state) => {
  const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));

  if (!decoded?.exp || Number(decoded.exp) < Date.now()) {
    throw new Error('State expired');
  }

  return decoded;
};

const getAllowedGoogleClientIds = () =>
  [process.env.GOOGLE_WEB_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_CLIENT_ID]
    .concat(String(process.env.GOOGLE_ALLOWED_CLIENT_IDS || '').split(','))
    .map((value) => String(value || '').trim())
    .filter(Boolean);

const isAllowedMobileRedirectUri = (redirectUri) =>
  redirectUri.startsWith(`${DEFAULT_MOBILE_SCHEME}://`);

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

const isLegacyUnverifiedAccount = (user) =>
  !user.email_verified &&
  !user.email_verification_token &&
  !user.email_verification_expires_at &&
  !user.email_verified_at;

const sendVerificationForUser = async (user, token) => {
  await sendEmailVerification({
    email: user.email,
    firstName: user.first_name || user.firstName || 'there',
    verificationUrl: buildVerificationUrl(token),
  });
};

const buildAuthSuccessPayload = (user) => {
  const { accessToken, refreshToken } = buildTokensForUser(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

const buildGoogleSuccessRedirectUrl = (redirectUri, payload) => {
  const target = new URL(redirectUri);
  target.searchParams.set('token', payload.accessToken);
  target.searchParams.set('user', Buffer.from(JSON.stringify(payload.user)).toString('base64url'));
  return target.toString();
};

const buildGoogleErrorRedirectUrl = (redirectUri, message) => {
  const target = new URL(redirectUri);
  target.searchParams.set('error', message);
  return target.toString();
};

const normalizeGoogleUserInfo = (userInfo) => ({
  email: userInfo.email,
  firstName: userInfo.given_name || userInfo.name?.split(' ')?.[0] || 'Google',
  lastName:
    userInfo.family_name ||
    userInfo.name?.split(' ')?.slice(1).join(' ') ||
    'User',
  googleId: userInfo.sub,
});

const createOAuthPassword = async () => hashPassword(crypto.randomBytes(32).toString('hex'));

const findOrCreateGoogleUser = async (googleUser) => {
  let user = await userModel.findUserByGoogleId(googleUser.googleId);

  if (!user) {
    user = await userModel.findUserByEmail(googleUser.email);
  }

  if (!user) {
    const generatedPassword = await createOAuthPassword();
    return userModel.createUser(
      googleUser.email,
      generatedPassword,
      googleUser.firstName,
      googleUser.lastName,
      null,
      {
        emailVerified: true,
        token: null,
        expiresAt: null,
        verifiedAt: new Date(),
      },
      {
        provider: 'google',
        googleId: googleUser.googleId,
      }
    );
  }

  return userModel.updateUser(user.id, {
    authProvider: user.auth_provider || 'google',
    googleId: user.google_id || googleUser.googleId,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    emailVerifiedAt: user.email_verified_at || new Date(),
    firstName: user.first_name || googleUser.firstName,
    lastName: user.last_name || googleUser.lastName,
  });
};

const validateGoogleAccessToken = async (accessToken) => {
  const tokenInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo', {
    params: { access_token: accessToken },
  });

  const allowedClientIds = getAllowedGoogleClientIds();
  const audience = tokenInfoResponse.data?.aud;

  if (allowedClientIds.length > 0 && audience && !allowedClientIds.includes(audience)) {
    throw new Error('Google token audience is not allowed');
  }

  const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.data?.email || userInfoResponse.data?.email_verified !== true) {
    throw new Error('Google account email is not verified');
  }

  return normalizeGoogleUserInfo(userInfoResponse.data);
};

const handleGoogleAuthWithAccessToken = async (accessToken) => {
  const googleUser = await validateGoogleAccessToken(accessToken);
  const user = await findOrCreateGoogleUser(googleUser);
  return buildAuthSuccessPayload(user);
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

    const user = await userModel.createUser(
      email,
      hashedPassword,
      firstName,
      lastName,
      phone,
      {
        emailVerified: false,
        token: verificationToken,
        expiresAt: verificationExpiresAt,
        verifiedAt: null,
      }
    );

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

    let authenticatedUser = user;

    if (isLegacyUnverifiedAccount(user)) {
      authenticatedUser = await userModel.markEmailVerified(user.id);
    }

    if (!authenticatedUser.email_verified) {
      return res
        .status(403)
        .json(apiResponse(false, null, 'Please verify your email before signing in.'));
    }

    const { accessToken, refreshToken } = buildTokensForUser(authenticatedUser);
    setAuthCookies(res, accessToken, refreshToken);

    res.json(
      apiResponse(
        true,
        {
          user: sanitizeUser(authenticatedUser),
          token: accessToken,
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json(apiResponse(false, null, 'Google access token is required'));
    }

    const payload = await handleGoogleAuthWithAccessToken(accessToken);
    setAuthCookies(res, payload.accessToken, payload.refreshToken);

    res.json(
      apiResponse(
        true,
        {
          user: payload.user,
          token: payload.accessToken,
        },
        'Google login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

const startGoogleOAuth = async (req, res) => {
  const mode = req.query.mode === 'mobile' ? 'mobile' : 'web';
  const requestedRedirectUri =
    typeof req.query.redirectUri === 'string' ? req.query.redirectUri : undefined;

  const redirectUri =
    mode === 'mobile'
      ? requestedRedirectUri && isAllowedMobileRedirectUri(requestedRedirectUri)
        ? requestedRedirectUri
        : `${DEFAULT_MOBILE_SCHEME}://oauth/google`
      : requestedRedirectUri || buildFrontendGoogleCallbackUrl();

  const state = createGoogleStateToken({ mode, redirectUri });
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID || '');
  authUrl.searchParams.set('redirect_uri', getGoogleCallbackUrl());
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
};

const googleOAuthCallback = async (req, res) => {
  let redirectUri = buildFrontendGoogleCallbackUrl();

  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(buildGoogleErrorRedirectUrl(redirectUri, 'Google sign-in was cancelled.'));
    }

    const parsedState = parseGoogleStateToken(String(state));
    redirectUri = parsedState.redirectUri || redirectUri;

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: getGoogleCallbackUrl(),
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data?.access_token;

    if (!accessToken) {
      return res.redirect(buildGoogleErrorRedirectUrl(redirectUri, 'Google sign-in failed.'));
    }

    const payload = await handleGoogleAuthWithAccessToken(accessToken);
    return res.redirect(buildGoogleSuccessRedirectUrl(redirectUri, payload));
  } catch (error) {
    const message =
      error?.response?.data?.error_description ||
      error?.response?.data?.error ||
      error.message ||
      'Google sign-in failed.';
    return res.redirect(buildGoogleErrorRedirectUrl(redirectUri, message));
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
  googleLogin,
  startGoogleOAuth,
  googleOAuthCallback,
  verifyEmail,
  resendVerificationEmail,
  logout,
  getCurrentUser,
  refreshToken,
};
