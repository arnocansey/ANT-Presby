const express = require('express');
const albumController = require('../controllers/albumController');

// Public: anyone with the link can view and download published albums; no sign-in.
const router = express.Router();

router.get('/', albumController.list);
router.get('/:id', albumController.getOne);
router.get('/:id/download', albumController.download);

module.exports = router;
