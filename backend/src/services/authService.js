const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../../models");
const { sendEmail } = require("./emailService");
const { User, RefreshToken } = db;
const { Op } = db.Sequelize;

const SALT_ROUNDS = 10;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const parsedPasswordResetExpiryMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES || 60);
const PASSWORD_RESET_TOKEN_EXPIRES_MINUTES = Number.isFinite(parsedPasswordResetExpiryMinutes) && parsedPasswordResetExpiryMinutes > 0
    ? parsedPasswordResetExpiryMinutes
    : 60;
const PASSWORD_RESET_RESPONSE_MESSAGE = "If an account with that email exists, a password reset link has been sent.";

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUsername = (username) => {
    return /^[a-zA-Z0-9_]+$/.test(username);
};

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

const generatePasswordResetToken = () => {
    return crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
};

const hashPasswordResetToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const getPasswordResetExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TOKEN_EXPIRES_MINUTES);
    return expiresAt;
};

const getPasswordResetBaseUrl = () => {
    if (process.env.PASSWORD_RESET_URL) {
        return process.env.PASSWORD_RESET_URL.trim();
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    return `${frontendUrl}/reset-password`;
};

const buildPasswordResetUrl = (token) => {
    let url;

    try {
        url = new URL(getPasswordResetBaseUrl());
    } catch (_error) {
        const error = new Error("Password reset URL configuration is invalid");
        error.statusCode = 500;
        throw error;
    }

    url.searchParams.set('token', token);
    return url.toString();
};

const buildPasswordResetEmail = ({ username, resetUrl }) => {
    const greetingName = username || 'there';

    return {
        subject: 'Reset your School Inventory password',
        text: [
            `Hello ${greetingName},`,
            '',
            'We received a request to reset your password.',
            `Open this link to choose a new password: ${resetUrl}`,
            '',
            `This link expires in ${PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutes.`,
            'If you did not request this, you can ignore this email.'
        ].join('\n'),
        html: `
            <p>Hello ${greetingName},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="${resetUrl}">Open the password reset page</a></p>
            <p>This link expires in ${PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
        `
    };
};

const registerUser = async ({ username, email, password, role }) => {
    if (!username || !email || !password) {
        const error = new Error("Username, email and password are required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const finalRole = role ? role.trim().toLowerCase() : "student";

    if (!isValidUsername(trimmedUsername)) {
        const error = new Error("Username can contain only letters, numbers and underscore");
        error.statusCode = 400;
        throw error;
    }

    if (!isValidEmail(normalizedEmail)) {
        const error = new Error("Invalid email format");
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 8) {
        const error = new Error("Password must be at least 8 characters long");
        error.statusCode = 400;
        throw error;
    }

    if (!["student", "teacher", "admin"].includes(finalRole)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [db.Sequelize.Op.or]: [
                { email: normalizedEmail },
                { username: trimmedUsername }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === normalizedEmail) {
            const error = new Error("Email already exists");
            error.statusCode = 409;
            throw error;
        }
        if (existingUser.username === trimmedUsername) {
            const error = new Error("Username already exists");
            error.statusCode = 409;
            throw error;
        }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        username: trimmedUsername,
        email: normalizedEmail,
        password_hash: hashedPassword,
        role: finalRole,
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
    };
};

const loginUser = async ({ email, username, password }) => {
    if ((!email && !username) || !password) {
        const error = new Error("Email or username and password are required");
        error.statusCode = 400;
        throw error;
    }

    let whereClause = {};

    if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        whereClause = db.Sequelize.where(
            db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
            normalizedEmail
        );
    } else {
        const normalizedUsername = username.trim().toLowerCase();
        whereClause = db.Sequelize.where(
            db.Sequelize.fn('LOWER', db.Sequelize.col('username')),
            normalizedUsername
        );
    }

    const user = await User.findOne({
        where: whereClause,
        attributes: ['id', 'username', 'email', 'role', 'password_hash', 'created_at']
    });

    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        expires_at: expiresAt
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
        },
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 401;
        throw error;
    }

    // Find refresh token in database
    const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
        attributes: ['id', 'user_id', 'token', 'expires_at'],
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role']
        }]
    });

    if (!tokenRecord) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    // Check if token is expired
    if (tokenRecord.isExpired()) {
        // Delete expired token
        await tokenRecord.destroy();
        const error = new Error("Refresh token has expired");
        error.statusCode = 401;
        throw error;
    }

    // Generate new access token
    const accessToken = generateAccessToken(tokenRecord.user);

    return {
        accessToken,
        user: {
            id: tokenRecord.user.id,
            username: tokenRecord.user.username,
            email: tokenRecord.user.email,
            role: tokenRecord.user.role,
        }
    };
};

const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 401;
        throw error;
    }

    // Delete the refresh token from database
    const deleted = await RefreshToken.destroy({
        where: { token: refreshToken }
    });

    if (deleted === 0) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    return {
        message: "Logout successful",
    };
};

const requestPasswordReset = async ({ email }) => {
    if (!email) {
        const error = new Error("Email is required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
        const error = new Error("Invalid email format");
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findOne({
        where: db.Sequelize.where(
            db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
            normalizedEmail
        ),
        attributes: ['id', 'username', 'email']
    });

    if (!user) {
        return {
            message: PASSWORD_RESET_RESPONSE_MESSAGE
        };
    }

    const rawResetToken = generatePasswordResetToken();
    const hashedResetToken = hashPasswordResetToken(rawResetToken);
    const resetExpiresAt = getPasswordResetExpiryDate();
    const resetUrl = buildPasswordResetUrl(rawResetToken);

    await user.update({
        password_reset_token_hash: hashedResetToken,
        password_reset_expires_at: resetExpiresAt
    });

    const emailPayload = buildPasswordResetEmail({
        username: user.username,
        resetUrl
    });

    try {
        await sendEmail({
            to: user.email,
            ...emailPayload
        });
    } catch (_error) {
        await user.update({
            password_reset_token_hash: null,
            password_reset_expires_at: null
        });

        const error = new Error("Unable to send password reset email");
        error.statusCode = 500;
        throw error;
    }

    return {
        message: PASSWORD_RESET_RESPONSE_MESSAGE
    };
};

const resetPassword = async ({ token, password }) => {
    if (!token || !password) {
        const error = new Error("Reset token and password are required");
        error.statusCode = 400;
        throw error;
    }

    const trimmedToken = token.trim();

    if (!trimmedToken) {
        const error = new Error("Reset token is required");
        error.statusCode = 400;
        throw error;
    }

    if (password.length < 8) {
        const error = new Error("Password must be at least 8 characters long");
        error.statusCode = 400;
        throw error;
    }

    const hashedResetToken = hashPasswordResetToken(trimmedToken);

    const user = await User.findOne({
        where: {
            password_reset_token_hash: hashedResetToken,
            password_reset_expires_at: {
                [Op.gt]: new Date()
            }
        },
        attributes: ['id', 'password_hash', 'password_reset_token_hash', 'password_reset_expires_at']
    });

    if (!user) {
        const error = new Error("Invalid or expired password reset token");
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.sequelize.transaction(async (transaction) => {
        await user.update({
            password_hash: hashedPassword,
            password_reset_token_hash: null,
            password_reset_expires_at: null
        }, { transaction });

        await RefreshToken.destroy({
            where: {
                user_id: user.id
            },
            transaction
        });
    });

    return {
        message: "Password reset successful"
    };
};

// Cleanup expired tokens (called by cron job)
const cleanupExpiredTokens = async () => {
    const deleted = await RefreshToken.destroy({
        where: {
            expires_at: {
                [db.Sequelize.Op.lt]: new Date()
            }
        }
    });

    console.log(`Cleaned up ${deleted} expired refresh tokens`);
    return deleted;
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    cleanupExpiredTokens,
};
