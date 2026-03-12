const { cleanupExpiredTokens } = require("../services/authService");

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every 1 hour

const startTokenCleanupJob = () => {
    const run = async () => {
        try {
            const deletedCount = await cleanupExpiredTokens();
            console.log(`[token-cleanup] Removed ${deletedCount} expired refresh token(s)`);
        } catch (error) {
            console.error("[token-cleanup] Cleanup failed:", error.message);
        } finally {
            const timer = setTimeout(run, CLEANUP_INTERVAL_MS);
            timer.unref();
        }
    };

    const initialTimer = setTimeout(run, CLEANUP_INTERVAL_MS);
    initialTimer.unref();
};

module.exports = {
    startTokenCleanupJob,
};