const { createServiceApp } = require('../../common/createServiceApp');
const authRoutes = require('../../../src/routes/authRoutes');

const app = createServiceApp({
    serviceName: 'auth-service',
    mountRoutes: (expressApp) => {
        // Change this to '/' to avoid nested /api/auth/api/auth issues
        expressApp.use('/', authRoutes);
    }
});

module.exports = app;