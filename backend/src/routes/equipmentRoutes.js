const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator'); // Added validationResult
const xss = require('xss');

// 1. Validation Logic
const validateEquipment = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long')
        .customSanitizer(value => xss(value)),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .customSanitizer(value => xss(value)),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description is too long')
        .customSanitizer(value => xss(value))
];

// 2. Helper to catch validation errors
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- ROUTES ---

// Added validation and error handling to POST
router.post('/',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipment,
    handleValidation,
    equipmentController.createEquipment
);

router.get('/', equipmentController.getEquipment);

router.get('/:id/condition-history', authenticateToken, authorizeRoles('admin'), equipmentController.getConditionHistory);
// Note: You had a duplicate route here for condition-history/ (trailing slash),
// Express usually handles this automatically, but keeping it is fine.

router.get('/:id', equipmentController.getEquipmentDetails);

router.put('/:id/status', authenticateToken, equipmentController.updateStatus);

// Added validation and error handling to PUT
router.put('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    validateEquipment,
    handleValidation,
    equipmentController.updateEquipment
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), equipmentController.deleteEquipment);

module.exports = router;