const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');

// POST /api/student/login - Login or create minimal account by email
router.post('/login', StudentController.login);

// POST /api/student/profile - Create student profile
router.post('/profile', StudentController.createProfile);

// GET /api/student/:studentId - Get student profile
router.get('/:studentId', StudentController.getProfile);

// PUT /api/student/:studentId - Update student profile
router.put('/:studentId', StudentController.updateProfile);

module.exports = router;
