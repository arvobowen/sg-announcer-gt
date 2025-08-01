// Load environment variables from the .env file
require('dotenv').config();

// Import necessary libraries
const express = require('express');
const axios = require('axios');

// Create an instance of an Express application
const app = express();

// Define the port the server will run on, or use the one from the environment
const port = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// A helper function to send the message to Teams to avoid duplicate code
const sendTeamsNotification = (webhookUrl, message) => {
  if (!webhookUrl) {
    console.error('Teams webhook URL is not defined. Check your .env file.');
    return Promise.reject('Webhook URL not configured');
  }
  return axios.post(webhookUrl, message);
};

// The main webhook endpoint
app.post('/github-webhook', (req, res) => {
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
    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": isPrerelease ? "FFA500" : "0076D7", // Orange for pre-release, Blue for release
      "summary": `New ${releaseType}: ${release.name}`,
      "sections": [{
        "activityTitle": `**New ${releaseType}:** [${release.name}](${release.html_url})`,
        "activitySubtitle": `by ${release.author.login}`,
        "facts": [{
          "name": "Repository",
          "value": req.body.repository.full_name
        }, {
          "name": "Tag",
          "value": release.tag_name
        }],
        "text": release.body || "No release notes provided."
      }]
    };

    // ** FIX: Wrap the MessageCard in the format the Teams Workflow expects **
    const payloadForTeams = {
      "type": "message",
      "attachments": [
        {
          "contentType": "application/vnd.microsoft.card.adaptive",
          "content": {
            "type": "AdaptiveCard",
            "body": [
              {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "Bolder",
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
                "title": "View Release",
                "url": release.html_url
              }
            ],
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2"
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