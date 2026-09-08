/**
 * Summary: This file contains the controller functions for handling public-facing
 * requests, such as serving the landing page and providing statistics data.
 */

const path = require('path');
const statsTracker = require('../Helpers/Statistics');

// Initialize the public controller with the provided configuration
const initializeController = (config) => {
	// Initalize the stats tracker with the provided configuration
	statsTracker.initializeStatistics(config);
};

// Endpoint that serves the index.html landing page
const getLandingPage = (req, res) => {
	res.sendFile(path.join(__dirname, '../public', 'index.html'));
};

// Endpoint that provides statistics data
const getStats = (req, res) => {
	res.json(statsTracker.getStats());
};

module.exports = {
	initializeController,
	getLandingPage,
	getStats
};