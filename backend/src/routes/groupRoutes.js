const express = require('express');
const groupController = require('../controllers/groupController');
const { optionalAuth, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, groupController.listGroups);
// Registered before '/:id' so 'mine' is not treated as an id.
router.get('/mine', isAuthenticated, groupController.listMyGroups);
router.get('/:id', optionalAuth, groupController.getGroup);
router.post('/:id/join', isAuthenticated, groupController.joinGroup);
router.delete('/:id/membership', isAuthenticated, groupController.leaveGroup);
router.get('/:id/requests', isAuthenticated, groupController.listRequests);
router.post('/:id/requests/:userId/approve', isAuthenticated, groupController.approveJoinRequest);
router.post('/:id/requests/:userId/decline', isAuthenticated, groupController.declineJoinRequest);

module.exports = router;
