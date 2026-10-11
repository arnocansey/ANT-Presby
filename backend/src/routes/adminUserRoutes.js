const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', userController.getAllUsers);
router.get('/check-in-cards', userController.listCheckInCards);
router.get('/:id', userController.getUserById);
router.put('/:id/role', userController.updateUserRole);
router.put('/:id/usher', userController.setUsher);
router.post('/:id/check-in-card/reset', userController.resetCheckInCard);
router.delete('/:id', userController.deleteUser);

module.exports = router;
