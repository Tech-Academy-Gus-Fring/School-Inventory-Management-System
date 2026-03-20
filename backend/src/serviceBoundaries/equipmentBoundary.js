const equipmentRoutes = require('../routes/equipmentRoutes');
const spatialRoutes = require('../routes/spatialRoutes');

module.exports = {
  name: 'equipment-service',
  description: 'Inventory catalog, asset status, condition history, and spatial placement.',
  owns: ['equipment', 'floors', 'rooms', 'return_condition_logs'],
  dependsOn: ['auth-service'],
  routes: [
    {
      mounts: ['/equipment', '/api/equipment'],
      router: equipmentRoutes
    },
    {
      mounts: ['/spatial', '/api/spatial'],
      router: spatialRoutes
    }
  ]
};
