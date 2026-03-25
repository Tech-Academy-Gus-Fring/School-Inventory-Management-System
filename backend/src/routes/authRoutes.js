const express = require("express");
const {
	register,
	login,
	refresh,
	logout,
	googleAuthUrl,
	googleExchange,
	telegramAuthUrl,
	telegramVerify,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/google/url", googleAuthUrl);
router.post("/google/exchange", googleExchange);
router.get("/telegram/url", telegramAuthUrl);
router.post("/telegram/verify", telegramVerify);

module.exports = router;