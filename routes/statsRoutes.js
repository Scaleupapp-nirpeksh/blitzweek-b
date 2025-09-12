const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Public stats routes
router.get('/stats', statsController.getStats);
router.get('/stats/live-count', statsController.getLiveCount);
router.get('/stats/event/:eventName', statsController.getEventStats);

module.exports = router;
