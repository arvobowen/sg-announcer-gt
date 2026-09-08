const statistics = require('../Helpers/Statistics');

// Initialize the stats tracker controller with the provided configuration
const initializeController = (config) => {
	statistics.initializeStatistics(config);
};

// Middleware to track stats for incoming API requests
const recordRequest = (req, res, next) => {
	statistics.incrementRequestCount();
	next();
};

module.exports = {
	initializeController,
	recordRequest
};