const express = require('express');
const router = express.Router();
const AnalysisController = require('../controllers/analysisController');

// POST /api/analysis - Analyze skill gap
router.post('/', AnalysisController.analyzeSkillGap);

// GET /api/analysis/student/:studentId - Get all analyses for student
router.get('/student/:studentId', AnalysisController.getStudentAnalyses);

// GET /api/analysis/:analysisId - Get analysis
router.get('/:analysisId', AnalysisController.getAnalysis);

module.exports = router;
