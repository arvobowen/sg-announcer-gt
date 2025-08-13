// index.js - Main entry point for the SG Announcer GitHub Teams integration
// This module handles incoming GitHub webhooks, verifies signatures, and sends notifications to Microsoft Teams.

// Import necessary modules
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const statsTracker = require('./stats-tracker');
const { createCardPayload } = require('./card-template');
const { exec } = require('child_process');
const expTools = require('./express-tools');
const { executionAsyncResource } = require('async_hooks');
const msTeams = require('./msteams-tools');
const e = require('express');

// Load environment variables from the .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// An optional init function that returns a Promise
const init = () => {
  return new Promise((resolve, reject) => {
    resolve('No initialization script created.');

    //// Only run this logic in a development environment
    //if (process.env.NODE_ENV === 'development') {
    //  console.log('[sg-announcer-gt] DEV MODE: Running swagger update script...');
    //  
    //  exec('npm run swagger:update', { cwd: __dirname }, (error, stdout, stderr) => {
    //    if (error) {
    //      console.error(`[sg-announcer-gt] Error running swagger update: ${error.message}`);
    //      // Reject the promise on error
    //      return reject(error);
    //    }
    //    if (stderr) {
    //      // Treat stderr as a potential error and reject
    //      console.error(`[sg-announcer-gt] Swagger update stderr: ${stderr}`);
    //      return reject(new Error(stderr));
    //    }
    //    console.log(`[sg-announcer-gt] Swagger update stdout: ${stdout}`);
    //    // Resolve the promise on success
    //    resolve(stdout);
    //  });
    //} else {
    //  // If not in dev mode, resolve immediately as there's nothing to do.
    //  resolve('Not in development mode, skipping init script.');
    //}
  });
};

// Create an Express Router
const router = express.Router();


// --- Middleware ---

// Check for required environment variables
if (!process.env.WEBHOOK_SECRET) {
  console.error('Error: WEBHOOK_SECRET is not defined in the environment variables.');
  process.exit(1);
}
if (!process.env.TEAMS_RELEASE_WEBHOOK_URL) {
  console.error('Error: TEAMS_RELEASE_WEBHOOK_URL is not defined in the environment variables.');
  process.exit(1);
}
if (!process.env.TEAMS_PRERELEASE_WEBHOOK_URL) {
  console.error('Error: TEAMS_PRERELEASE_WEBHOOK_URL is not defined in the environment variables.');
  process.exit(1);
}

// Serve static files (like logo.png and stats-client.js) from this orb's 'public' folder
router.use(express.static(path.join(__dirname, 'public')));

// Serve Swagger UI at /docs
const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// --- Routes ---

// GET / : Serve the index.html landing page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /stats : Endpoint to provide statistics data
router.get('/stats', (req, res) => {
  res.json(statsTracker.getStats());
});

// POST / : The main webhook receiver that identifies swagger requests, verifies the GitHub signature, and processes release events.
router.post('/', expTools.CheckSwagger, expTools.CheckGitHubSignature, (req, res) => {
  // Track incoming requests
  const referer = expTools.IdentifyRequestOrigin(req);
  console.log(`New incoming request, referer: ${referer}`); 
  statsTracker.incrementRequestCount();

  // Extract the relevant data from the request body
  const { release, repository, action } = req.body;
  const isReleaseEvent = action === 'published' && release;

  // Validate the requests data
  let validationErrors = [];
  if (release === null || release === undefined) {
    validationErrors.push("Missing release data (release).");
  } else {
    if (release.prerelease === null || release.prerelease === undefined || typeof release.prerelease !== 'boolean')
      validationErrors.push("Missing release type (release/prerelease).");
    if (release.name === null || release.name === undefined || release.name === "")
      validationErrors.push("Missing release type (release/name).");
    if (release.body === null || release.body === undefined || release.body === "")
      validationErrors.push("Missing release's body (release/body).");
    if (release.html_url === null || release.html_url === undefined || release.html_url === "")
      validationErrors.push("Missing release's url (release/html_url).");
    if (release.author === null || release.author === undefined) {
      validationErrors.push("Missing author data (release/author).");
    } else {
      if (release.author.avatar_url === null || release.author.avatar_url === undefined || release.author.avatar_url === "")
        validationErrors.push("Missing author's avatar url (release/author/avatar_url).");
      if (release.author.login === null || release.author.login === undefined || release.author.login === "")
        validationErrors.push("Missing author's login account (release/author/login).");
    }
  }
  if (repository === null || repository === undefined) {
    validationErrors.push("Missing repository data (repository).");
  } else {
    if (repository.full_name === null || repository.full_name === undefined || repository.full_name === "")
      validationErrors.push("Missing repository's full name (repository/full_name).");
    if (repository.visibility === null || repository.visibility === undefined || repository.visibility === "")
      validationErrors.push("Missing repository's visibility (repository/visibility).");
    if (repository.html_url === null || repository.html_url === undefined || repository.html_url === "")
      validationErrors.push("Missing repository's url (repository/html_url).");
  }
  if (validationErrors.length > 0) {
    console.error(`Validation failed:\n  ${validationErrors.join('\n  ')}`);
    return res.status(400).send(`Validation failed:\n  ${validationErrors.join('\n  ')}`);
  }

  // Determine the release type and the target webhook URL based on the release type
  const isPrerelease = release.prerelease;
  const targetWebhookUrl = isPrerelease 
    ? process.env.TEAMS_PRERELEASE_WEBHOOK_URL 
    : process.env.TEAMS_RELEASE_WEBHOOK_URL;
  const releaseType = isPrerelease ? "Pre-Release" : "Release";
  const releaseInfo = `New ${releaseType} published: ${release.name} by ${release.author.login}`;

  // Create the payload for Microsoft Teams using the card template
  const payloadForTeams = createCardPayload(release, repository, releaseType);

  if (req.isSwaggerTest) {
    console.log("Received a Swagger test event.  Not sending to Teams.");
    console.log(releaseInfo);

    // A JSON object containing all the information you want to return
    const responsePayload = {
      message: "Swagger test successful.",
      releaseInfo: releaseInfo,
      payloadForTeams: payloadForTeams
    };

    res.status(200).send(responsePayload);
  } else if (isReleaseEvent) {
    console.log("Received a GitHub 'published' event.  Sending to Teams.");
    console.log(releaseInfo);

    // Send the notification to Microsoft Teams
    msTeams.SendTeamsNotification(targetWebhookUrl, payloadForTeams)
      .then(response => {
        console.log(`Successfully sent ${releaseType} notification to Teams`);
        res.status(200).send("Notification sent to Teams");
      })
      .catch(error => {
        console.error(`Error sending ${releaseType} notification to Teams:`, error.message);
        res.status(500).send("Error sending notification");
      });
  } else {
    console.log("Received a non-supported event, ignoring.");
    res.status(200).send("Unsupported event received and ignored.");
  }
});

// Export the router and the path for the core server to use
module.exports = {
  path: '/sg-announcer-gt',
  router: router,
  init: init,
};