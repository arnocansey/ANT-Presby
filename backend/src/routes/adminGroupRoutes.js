const express = require('express');
const groupController = require('../controllers/groupController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateGroup, validateGroupLeaders } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', groupController.adminListGroups);
router.post('/', validateGroup, handleValidationErrors, groupController.adminCreateGroup);
router.put('/:id', validateGroup, handleValidationErrors, groupController.adminUpdateGroup);
router.delete('/:id', groupController.adminDeactivateGroup);
router.put('/:id/leaders', validateGroupLeaders, handleValidationErrors, groupController.adminSetLeaders);

module.exports = router;
