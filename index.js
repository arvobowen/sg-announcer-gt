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

// Run strict environment validation FIRST. If it fails, an error is thrown and SpiderGate catches it immediately.
let orbConfig = {};
const { validateAndLoadEnv } = require('./Helpers/EnvManager');


// Middleware
const statsTracker = require('./middleware/statsTracker');


// Controllers
const publicController = require('./controllers/public');


// Webhooks (third party integrations)
const { setupWebhookRoutes } = require('./webhooks/setupWebhookRoutes');


// Express router for handling orb-specific routes
const router = express.Router();

// Inject orbConfig into every request for easy access within route handlers
router.use((req, res, next) => {
  req.orbConfig = orbConfig;
  next();
});



// --- STATIC FILES ---
// Serve static files (like logo.png and stats-client.js) from this orb's 'public' folder
router.use(express.static(path.join(__dirname, 'public')));



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



// --- INITIALIZATION FUNCTION (OPTIONAL) ---
// An optional init function that is called by spidergate which returns a Promise
const init = (sgContext = {}) => {
  return new Promise(async (resolve, reject) => {
    // Extract the injected logger, fallback to console if not provided
    const log = sgContext.log || console;

    try {
      log.message("\tsg-announcer-gt orb initializing...");

      // Resolve the data directory for the orb and ensure it exists
      const dataDir = getDataDir('SpiderGate');
      log.message('\tData directory resolved to:');
      log.info(`\t > ${dataDir}`);

      // Validate and load the environment configuration for the orb
      orbConfig = validateAndLoadEnv(dataDir, log);
      log.success(`\tOrb configuration loaded successfully.`);

      // Initialize the middleware modules with the orb configuration
      statsTracker.initializeMiddleware(orbConfig);
      log.success(`\tMiddleware modules initialized successfully.`);

      // Initialize the controller modules with the orb configuration
      publicController.initializeController(orbConfig);
      log.success(`\tController modules initialized successfully.`);

      // Load the webhook secret from the environment variables after validating and loading
      // the .env file the fail fast if the webhook secret is missing
      const secret = orbConfig.WEBHOOK_SECRET || null;
      if (!secret) {
        throw new Error('Unable to load orb due to missing WEBHOOK_SECRET value in the .env file.');
      }
      log.success(`\tGitHub webhook secret key loaded successfully.`);

      log.success("\tsg-announcer-gt orb initialized successfully.");
      resolve('orb initialization complete.');
    } catch (error) {
      log.error(`Initialization failed and orb not loaded: ${error.message}`);

      // Rejecting this promise prevents SpiderGate from loading the orb
      reject(error);
    }
  });
};



// Export the router and the path for the core server to use
module.exports = {
  path: '/sg-announcer-gt',
  router: router,
  init: init,
};