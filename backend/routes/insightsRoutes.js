const express = require('express');
const router = express.Router();
const InsightsController = require('../controllers/insightsController');

// GET /api/insights/market/trends - Get market trends
router.get('/market/trends', InsightsController.getMarketTrends);

// GET /api/insights/recommendations - Get recommendations
router.get('/recommendations', InsightsController.getRecommendations);

// GET /api/insights/:studentId - Get career insights
router.get('/:studentId', InsightsController.getCareerInsights);

module.exports = router;
