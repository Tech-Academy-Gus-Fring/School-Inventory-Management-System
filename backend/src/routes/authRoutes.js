const express = require("express");
const {register, login, refresh, logout} = require("../controllers/authController");
const {body} = require('express-validator'); // New

const router = express.Router();

// Validation for Registration
const validateRegister = [
    body('username').trim().notEmpty().withMessage('Username is required'), // Added this
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty()
];

// Validation for Login
const validateLogin = [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;