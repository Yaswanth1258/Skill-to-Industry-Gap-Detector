const express = require('express');
const router = express.Router();
const RoadmapController = require('../controllers/roadmapController');

// POST /api/roadmap - Generate learning roadmap
router.post('/', RoadmapController.generateRoadmap);

// PUT /api/roadmap/:roadmapId/progress - Update topic progress
router.put('/:roadmapId/progress', RoadmapController.updateTopicProgress);

// GET /api/roadmap/student/:studentId - Get student roadmaps
router.get('/student/:studentId', RoadmapController.getStudentRoadmaps);

// GET /api/roadmap/:roadmapId - Get roadmap
router.get('/:roadmapId', RoadmapController.getRoadmap);

module.exports = router;
