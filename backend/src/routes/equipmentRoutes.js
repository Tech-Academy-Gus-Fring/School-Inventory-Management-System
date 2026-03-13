const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Requirement: GET /equipment/{id}
router.get('/:id', equipmentController.getEquipmentDetails);
router.get('/equipment', equipmentController.getEquipment);


module.exports = router;