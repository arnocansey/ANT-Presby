const express = require('express');
const devotionalController = require('../controllers/devotionalController');

const router = express.Router();

router.get('/', devotionalController.listArchive);
// Registered before '/:id' so 'today' is not treated as an id.
router.get('/today', devotionalController.getToday);
router.get('/:id', devotionalController.getOne);

module.exports = router;
