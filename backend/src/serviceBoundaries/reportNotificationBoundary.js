const reportRoutes = require('../routes/reportRoutes');

module.exports = {
  name: 'report-notification-service',
  description: 'Reporting endpoints today, with notification/event fan-out as the next extraction step.',
  owns: ['report projections', 'notification jobs'],
  dependsOn: ['auth-service', 'equipment-service', 'request-service'],
  routes: [
    {
      mounts: ['/reports', '/api/reports'],
      router: reportRoutes
    }
  ]
};
