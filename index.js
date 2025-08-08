// Load environment variables from the .env file
require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const axios = require('axios');

// Import the template function
const { createCardPayload } = require('./card-template');

// Create an Express Router
const router = express.Router();

// --- Security Middleware ---
const verifyGitHubSignature = (req, res, next) => {
  const signature = req.get('X-Hub-Signature-256');
  if (!signature) {
    return res.status(401).send('No signature provided');
  }
  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send('Invalid signature');
  }
  next();
};

// Helper function to send notifications
const sendTeamsNotification = (webhookUrl, message) => {
   if (!webhookUrl) {
       console.error('Teams webhook URL is not defined. Check your .env file.');
       return Promise.reject('Webhook URL not configured');
   }
   return axios.post(webhookUrl, message);
};

// Define the endpoint for this orb's router
router.post('/', verifyGitHubSignature, (req, res) => {
  if (req.body.action === 'published' && req.body.release) {
    const { release, repository } = req.body;
    const isPrerelease = release.prerelease;
    const targetWebhookUrl = isPrerelease 
      ? process.env.TEAMS_PRERELEASE_WEBHOOK_URL 
      : process.env.TEAMS_RELEASE_WEBHOOK_URL;
    const releaseType = isPrerelease ? 'Pre-Release' : 'Release';

    console.log(`New ${releaseType} published: ${release.name} by ${release.author.login}`);

    // Generate the card payload using the template module
    const payloadForTeams = createCardPayload(release, repository, releaseType);

    sendTeamsNotification(targetWebhookUrl, payloadForTeams)
      .then(response => {
        console.log(`Successfully sent ${releaseType} notification to Teams`);
        res.status(200).send('Notification sent to Teams');
      })
      .catch(error => {
        console.error(`Error sending ${releaseType} notification to Teams:`, error.message);
        res.status(500).send('Error sending notification');
      });
  } else {
    console.log('Received a non-release event, ignoring.');
    res.status(200).send('Event received and ignored');
  }
});

// Add Swagger UI for API Documentation
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Export an object containing the path and the router
module.exports = {
  path: '/github-teams-announcer',
  router: router
};