const statistics = require('../Helpers/Statistics');

// Initialize the stats tracker middleware with the provided configuration
const initializeMiddleware = (config) => {
	statistics.initializeStatistics(config);
};

// Middleware to track stats for incoming API requests
const recordRequest = (req, res, next) => {
	statistics.incrementRequestCount();
	next();
};

module.exports = {
	initializeMiddleware,
	recordRequest
};