const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const donationModel = require('../models/donationModel');
const paymentService = require('../services/paymentService');
const auditLogModel = require('../models/auditLogModel');
const { isAllowedAppRedirectUri } = require('../utils/redirects');

const normalizeDonationPayload = (body) => ({
  amount: body.amount,
  donationType: body.donationType || body.donation_type,
  paymentMethod: body.paymentMethod || body.payment_method,
  reference: body.reference,
  notes: body.notes,
  callbackUrl: body.callbackUrl || body.callback_url,
});

const isAdmin = (req) => req.user?.role === 'admin';

// Fields a donor may change on their own donation; everything else (status, amount, reference) is admin-only.
const MEMBER_EDITABLE_DONATION_FIELDS = ['notes'];

const pickMemberDonationUpdates = (body = {}) =>
  MEMBER_EDITABLE_DONATION_FIELDS.reduce((updates, field) => {
    if (body[field] !== undefined) updates[field] = body[field];
    return updates;
  }, {});

const buildCallbackUrl = (value, reference) => {
  const fallbackBase = process.env.FRONTEND_URL || 'http://localhost:3000';
  const base = isAllowedAppRedirectUri(value) ? value : `${fallbackBase}/donate`;

  try {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}reference=${encodeURIComponent(reference)}`;
  } catch (_error) {
    return `${fallbackBase}/donate?reference=${encodeURIComponent(reference)}`;
  }
};

const createDonation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { amount, donationType, paymentMethod, reference, notes } = normalizeDonationPayload(req.body);

    // Payment references link a donation to a Paystack charge, so members cannot choose their own.
    const donation = await donationModel.createDonation(
      userId,
      amount,
      donationType,
      paymentMethod,
      isAdmin(req) ? reference : null,
      notes
    );

    res.status(201).json(apiResponse(true, donation, 'Donation recorded'));
  } catch (error) {
    next(error);
  }
};

const initializeDonationPayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { amount, donationType, paymentMethod, notes, callbackUrl } = normalizeDonationPayload(req.body);

    const reference = paymentService.generatePaymentReference();
    const resolvedCallbackUrl = buildCallbackUrl(callbackUrl, reference);

    const donation = await donationModel.createDonation(
      userId,
      amount,
      donationType,
      paymentMethod,
      reference,
      notes
    );

    const payment = await paymentService.initializePayment({
      email: req.user.email,
      amount,
      reference,
      callbackUrl: resolvedCallbackUrl,
      metadata: {
        userId,
        donationId: donation.id,
        donationType,
      },
    });

    res.status(201).json(
      apiResponse(
        true,
        {
          donation,
          payment,
        },
        'Donation payment initialized'
      )
    );
  } catch (error) {
    next(error);
  }
};

const verifyDonationPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const donation = await donationModel.getDonationByReference(reference);
    if (!donation) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    if (req.user.role !== 'admin' && donation.user_id !== req.user.userId) {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    if (donation.status === 'completed') {
      return res.json(apiResponse(true, { donation }, 'Donation already verified'));
    }

    const payment = await paymentService.verifyPayment(reference);
    const isPaid =
      payment.status === 'success' && paymentService.isPaidAmountValid(donation.amount, payment.amount);
    const nextStatus = isPaid ? 'completed' : 'failed';
    const updated = await donationModel.updateDonationStatusByReference(reference, nextStatus);

    res.json(apiResponse(true, { donation: updated, payment }, 'Donation payment verified'));
  } catch (error) {
    next(error);
  }
};

const handleDonationWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const raw = req.body;

    // This route must receive the unparsed body (see server.js); signatures are computed over raw bytes.
    if (!Buffer.isBuffer(raw)) {
      return res.status(400).json(apiResponse(false, null, 'Webhook body must be raw JSON'));
    }

    if (paymentService.hasPaystackConfig()) {
      const valid = paymentService.isValidWebhookSignature(raw, signature);
      if (!valid) {
        return res.status(401).json(apiResponse(false, null, 'Invalid webhook signature'));
      }
    } else if (!paymentService.isMockPaymentAllowed()) {
      return res.status(503).json(apiResponse(false, null, 'Payments are not configured'));
    }

    let payload;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch (_error) {
      return res.status(400).json(apiResponse(false, null, 'Invalid webhook payload'));
    }

    if (payload.event === 'charge.success' && payload.data?.reference) {
      const donation = await donationModel.getDonationByReference(payload.data.reference);

      if (
        donation &&
        donation.status !== 'completed' &&
        paymentService.isPaidAmountValid(donation.amount, payload.data.amount)
      ) {
        await donationModel.updateDonationStatusByReference(payload.data.reference, 'completed');
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

const getAllDonations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, donation_type } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const filters = {};
    if (status) filters.status = status;
    if (donation_type) filters.donationType = donation_type;

    const donations = await donationModel.getAllDonations(offset, limitNum, filters);
    const total = await donationModel.countDonations(filters);
    const meta = buildPaginationMeta(total, page, limit);

    res.json(apiResponse(true, donations, 'Donations retrieved', meta));
  } catch (error) {
    next(error);
  }
};

const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donation = await donationModel.getDonationById(id);

    if (!donation) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    if (req.user.role !== 'admin' && donation.user_id !== req.user.userId) {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    res.json(apiResponse(true, donation, 'Donation retrieved'));
  } catch (error) {
    next(error);
  }
};

const getUserDonations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limitNum } = getPagination(page, limit);

    const donations = await donationModel.getUserDonations(userId, offset, limitNum);

    res.json(apiResponse(true, donations, 'User donations retrieved'));
  } catch (error) {
    next(error);
  }
};

const updateDonationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid status'));
    }

    const updatedDonation = await donationModel.updateDonationStatus(id, status);

    if (!updatedDonation) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    await auditLogModel.createAuditLog({
      actorUserId: req.user.userId,
      entityType: 'donation',
      entityId: Number(id),
      action: 'status_update',
      summary: `Updated donation #${id} status to ${status}`,
      metadata: { status },
    });

    res.json(apiResponse(true, updatedDonation, 'Donation status updated'));
  } catch (error) {
    next(error);
  }
};

const updateDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donation = await donationModel.getDonationById(id);

    if (!donation) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    if (!isAdmin(req) && donation.user_id !== req.user.userId) {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    const updates = isAdmin(req) ? req.body : pickMemberDonationUpdates(req.body);
    const updatedDonation = await donationModel.updateDonation(id, updates);

    res.json(apiResponse(true, updatedDonation, 'Donation updated'));
  } catch (error) {
    next(error);
  }
};

const deleteDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donation = await donationModel.getDonationById(id);

    if (!donation) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    if (donation.status !== 'pending') {
      return res.status(400).json(apiResponse(false, null, 'Can only delete pending donations'));
    }

    if (req.user.role !== 'admin' && donation.user_id !== req.user.userId) {
      return res.status(403).json(apiResponse(false, null, 'Unauthorized'));
    }

    const result = await donationModel.deleteDonation(id);

    if (!result) {
      return res.status(404).json(apiResponse(false, null, 'Donation not found'));
    }

    res.json(apiResponse(true, null, 'Donation deleted'));
  } catch (error) {
    next(error);
  }
};

const getDonationStatistics = async (req, res, next) => {
  try {
    const stats = await donationModel.getDonationStatistics();
    const byType = await donationModel.getDonationsByType();

    res.json(
      apiResponse(
        true,
        {
          summary: stats,
          byType,
        },
        'Donation statistics retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  initializeDonationPayment,
  verifyDonationPayment,
  handleDonationWebhook,
  getAllDonations,
  getDonationById,
  getUserDonations,
  updateDonationStatus,
  updateDonation,
  deleteDonation,
  getDonationStatistics,
};
