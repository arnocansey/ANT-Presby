const express = require('express');
const sermonController = require('../controllers/sermonController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateSermonCreation } = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', sermonController.getAllSermons);
router.get('/:id', sermonController.getSermonById);
router.post('/', validateSermonCreation, handleValidationErrors, sermonController.createSermon);
router.put('/:id', sermonController.updateSermon);
router.delete('/:id', sermonController.deleteSermon);

module.exports = router;
