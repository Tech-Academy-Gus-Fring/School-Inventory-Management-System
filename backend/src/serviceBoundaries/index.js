const authBoundary = require('./authBoundary');
const equipmentBoundary = require('./equipmentBoundary');
const requestBoundary = require('./requestBoundary');
const reportNotificationBoundary = require('./reportNotificationBoundary');

const serviceBoundaries = [
  authBoundary,
  equipmentBoundary,
  requestBoundary,
  reportNotificationBoundary
];

const mountServiceBoundaries = (app) => {
  for (const boundary of serviceBoundaries) {
    for (const route of boundary.routes) {
      for (const mountPath of route.mounts) {
        app.use(mountPath, route.router);
      }
    }
  }
};

module.exports = {
  serviceBoundaries,
  mountServiceBoundaries
};
