const express = require('express');
const communityFeedController = require('../controllers/communityFeedController');
const { optionalAuth, isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, communityFeedController.getFeed);
router.post('/', isAuthenticated, communityFeedController.createPost);
router.delete('/:id', isAuthenticated, communityFeedController.deletePost);
router.post('/:id/comments', isAuthenticated, communityFeedController.addComment);
router.delete('/:id/comments/:commentId', isAuthenticated, communityFeedController.deleteComment);
router.post('/:id/like', isAuthenticated, communityFeedController.toggleLike);

module.exports = router;
