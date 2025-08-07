// Load environment variables from the .env file
require('dotenv').config();
const crypto = require('crypto');

// Import necessary libraries
const express = require('express');
const axios = require('axios');

// Create an instance of an Express application
const app = express();

// Define the port the server will run on, or use the one from the environment
const port = process.env.PORT || 3000;

// --- Security Middleware ---
// This function verifies the signature of the incoming webhook
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

// Middleware to parse incoming JSON payloads
// IMPORTANT: We need the raw body for signature verification, so we use a special setup
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// A helper function to send the message to Teams to avoid duplicate code
const sendTeamsNotification = (webhookUrl, message) => {
  if (!webhookUrl) {
    console.error('Teams webhook URL is not defined. Check your .env file.');
    return Promise.reject('Webhook URL not configured');
  }
  return axios.post(webhookUrl, message);
};

// The main webhook endpoint - now protected by our security middleware
app.post('/github-webhook', verifyGitHubSignature, (req, res) => {
  // Check if the event is a 'published' release
  if (req.body.action === 'published' && req.body.release) {
    const release = req.body.release;
    const isPrerelease = release.prerelease;

    // Determine which webhook URL to use
    const targetWebhookUrl = isPrerelease 
      ? process.env.TEAMS_PRERELEASE_WEBHOOK_URL 
      : process.env.TEAMS_RELEASE_WEBHOOK_URL;

    const releaseType = isPrerelease ? 'Pre-Release' : 'Release';
    console.log(`New ${releaseType} published: ${release.name} by ${release.author.login}`);

    // Prepare the notification card for Microsoft Teams
    const payloadForTeams = {
      "type": "message",
      "attachments": [
        {
          "contentType": "application/vnd.microsoft.card.adaptive",
          "content": {
            "type": "AdaptiveCard",
            "body": [
              {
                "type": "Image",
                "style": "RoundedCorners",
                "horizontalAlignment": "Right",
                "url": "https://raw.githubusercontent.com/KofileDev/georgia-public-assets/main/github-teams-bot/announcement-banner.png"
              },
              {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "bolder",
                "text": `New ${releaseType}: ${release.name}`
              },
              {
                "type": "ColumnSet",
                "columns": [
                  {
                    "type": "Column",
                    "width": "auto",
                    "items": [
                      {
                        "type": "Image",
                        "url": release.author.avatar_url,
                        "size": "Small",
                        "style": "Person"
                      }
                    ]
                  },
                  {
                    "type": "Column",
                    "width": "stretch",
                    "items": [
                      {
                        "type": "TextBlock",
                        "weight": "Bolder",
                        "text": `by ${release.author.login}`,
                        "wrap": true
                      },
                      {
                        "type": "TextBlock",
                        "spacing": "None",
                        "text": `Repository: ${req.body.repository.full_name}`,
                        "isSubtle": true,
                        "wrap": true
                      },
                      {
                        "type": "TextBlock",
                        "spacing": "None",
                        "text": `Visibility: ${req.body.repository.visibility}`,
                        "isSubtle": true,
                        "wrap": true
                      }
                    ]
                  }
                ]
              },
              {
                "type": "TextBlock",
                "text": release.body || "No release notes provided.",
                "wrap": true
              }
            ],
            "actions": [
              {
                "type": "Action.OpenUrl",
                "title": "View Release Information",
                "url": release.html_url
              },
              {
                "type": "Action.OpenUrl",
                "title": "Release History",
                "url": `${req.body.repository.html_url}/releases`
              }
            ],
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "speak": `New ${releaseType}: ${release.name}`
          }
        }
      ]
    };

    // Send the notification to the correct Teams channel
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
    // If it's not a 'published' release event, just acknowledge it
    console.log('Received a non-release event, ignoring.');
    res.status(200).send('Event received and ignored');
  }
});

// A simple GET route for basic testing
app.get('/', (req, res) => {
  res.send('Node.js server is running and ready for webhooks!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});