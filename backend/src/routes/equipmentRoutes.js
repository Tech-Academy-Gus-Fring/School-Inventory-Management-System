const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Публични маршрути
router.get('/', equipmentController.getEquipment);
router.get('/:id', equipmentController.getEquipmentDetails);
router.put('/:id/status', equipmentController.updateStatus);
router.delete('/:id', authenticateToken, authorizeRoles("admin"), equipmentController.deleteEquipment);

module.exports = router;