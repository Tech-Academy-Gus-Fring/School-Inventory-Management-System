const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const userRoutes = require('../routes/userRoutes');

module.exports = {
  name: 'auth-service',
  description: 'Authentication, identity, token lifecycle, and user/account administration.',
  owns: ['users', 'refresh_tokens'],
  dependsOn: [],
  routes: [
    {
      mounts: ['/auth', '/api/auth'],
      router: authRoutes
    },
    {
      mounts: ['/admin', '/api/admin'],
      router: adminRoutes
    },
    {
      mounts: ['/users', '/api/users'],
      router: userRoutes
    }
  ]
};
