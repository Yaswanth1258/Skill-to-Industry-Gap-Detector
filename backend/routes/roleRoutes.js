const express = require('express');
const router = express.Router();
const RolesController = require('../controllers/rolesController');

// GET /api/roles - Get all roles
router.get('/', RolesController.getAllRoles);

// GET /api/roles/search - Search roles
router.get('/search', RolesController.searchRoles);

// GET /api/roles/top - Get top in-demand roles
router.get('/top', RolesController.getTopRoles);

// POST /api/roles/custom - Create custom role from user input
router.post('/custom', RolesController.createCustomRole);

// GET /api/roles/:roleId - Get role by ID
router.get('/:roleId', RolesController.getRoleById);

module.exports = router;
