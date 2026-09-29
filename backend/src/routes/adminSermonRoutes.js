const express = require('express');
const sermonController = require('../controllers/sermonController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  handleValidationErrors,
  validateSermonCreation,
  validateSermonSeriesLink,
} = require('../middleware/validators');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', sermonController.getAllSermons);
router.get('/:id', sermonController.getSermonById);
router.post(
  '/',
  validateSermonCreation,
  validateSermonSeriesLink,
  handleValidationErrors,
  sermonController.createSermon
);
router.put('/:id', validateSermonSeriesLink, handleValidationErrors, sermonController.updateSermon);
router.delete('/:id', sermonController.deleteSermon);

module.exports = router;
