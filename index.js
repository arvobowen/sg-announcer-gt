/**
 * Summary: Main entry point for the SG Announcer GitHub Teams integration
 * Description: This module handles incoming GitHub webhooks, verifies signatures, and sends notifications to Microsoft Teams.
 */

// Node.js built-in module includes
const path = require('path');
const fs = require('fs');

// Third party module includes
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');


// Determine the data directory for persistent storage
const { getDataDir } = require('./Helpers/OS');
const dataDir = getDataDir('SpiderGate');

// Run strict environment validation FIRST. If it fails, an error is thrown and SpiderGate catches it immediately.
const { validateAndLoadEnv } = require('./Helpers/EnvManager');
validateAndLoadEnv(dataDir);


// Middleware
const identity = require('./middleware/identity');
const statsTracker = require('./middleware/statsTracker');


// Controllers
const publicController = require('./controllers/public');


// Webhooks (third party integrations)
const { setupWebhookRoutes } = require('./webhooks/setupWebhookRoutes');


// Load the webhook secret from the environment variables after validating and loading the .env file
const secret = process.env.WEBHOOK_SECRET || null;

// Fail fast if the webhook secret is missing
if (!secret) {
  throw new Error('Unable to load orb due to missing WEBHOOK_SECRET value in the .env file.');
}

// An optional init function that is called by spidergate which returns a Promise
const init = () => {
  return new Promise((resolve, reject) => {
    resolve('No initialization script created.');
  });
};

const router = express.Router();

// Serve static files (like logo.png and stats-client.js) from this orb's 'public' folder
router.use(express.static(path.join(__dirname, 'public')));



// --- GLOBAL UMBRELLA (middleware used for all requests) ---
// Inject clean IP and origin strings into EVERY request
router.use(identity.requestOrigin);



// --- ROUTES: PUBLIC ---
// GET / : Serve the index.html landing page explicitly
router.get('/', publicController.getLandingPage);



// --- ROUTES: SWAGGER UI (API TESTING AND DOCUMENTATION) ---
const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



// --- ROUTES: STATISTICS/METRICS ---
// GET /stats : Provides statistics data to the landing page
router.get('/stats', publicController.getStats);



// --- GLOBAL API UMBRELLA (track request statistics for EVERY request) ---
router.use('/api/v1', statsTracker.recordRequest);



// --- ROUTES: WEBHOOKS ---
// Setup third-party webhook routes that do not require authentication
// (such as incoming requests from GitHub or Stripe)
// /api/v1/webhooks/* is the base path for all webhook routes
// Note: See "webhooks" folder for the actual supported route handlers
setupWebhookRoutes(router);



// Export the router and the path for the core server to use
module.exports = {
  path: '/sg-announcer-gt',
  router: router,
  init: init,
};