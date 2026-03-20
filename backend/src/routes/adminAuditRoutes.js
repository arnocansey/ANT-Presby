const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
