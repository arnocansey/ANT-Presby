const express = require('express');
const devotionalController = require('../controllers/devotionalController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateDevotional } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', devotionalController.adminList);
router.post('/', validateDevotional, handleValidationErrors, devotionalController.adminCreate);
router.put('/:id', validateDevotional, handleValidationErrors, devotionalController.adminUpdate);
router.delete('/:id', devotionalController.adminDelete);
router.post('/:id/publish', devotionalController.adminPublish);

module.exports = router;
