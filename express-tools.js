// File: express-tools.js
// This module provides middleware functions for Express.js applications.

// Import necessary modules
const crypto = require('crypto');

// Function to identify the origin of incoming requests based on headers.
// It checks the User-Agent, Referer, and X-Forwarded-For headers to determine the source.
const IdentifyRequestOrigin = (req) => {
    const userAgent = req.get('User-Agent') || 'N/A';
    const referer = req.get('Referer') || 'N/A';
    const forwardedFor = req.get('X-Forwarded-For') || 'N/A';
    const clientIp = forwardedFor.split(',')[0].trim() || req.ip;
  
    let originString = `Client IP: ${clientIp}`;
  
    if (userAgent.startsWith('GitHub-Hookshot/')) {
      originString += ' | Source: GitHub Webhook';
    } else if (referer.includes('/docs/')) {
      originString += ` | Source: Swagger UI (${referer})`;
    } else {
      originString += ` | Source: Web Browser (${referer})`;
    }
  
    //originString += ` | User-Agent: ${userAgent}`;
  
    return originString;
};

// Identify requests coming from the Swagger UI test page.
const CheckSwagger = (req, res, next) => {
  const referer = req.get('Referer');

  // If the 'Referer' header exists and ends with '/docs/', it's a Swagger test.
  if (referer && (referer.includes('/docs/') || referer.endsWith('/docs'))) {
    req.isSwaggerTest = true;
  } else {
    req.isSwaggerTest = false;
  }
  next();
};

// Used for security: verify the GitHub webhook signature
// Checks the signature of incoming requests to ensure they are from GitHub.
const CheckGitHubSignature = (req, res, next) => {
  // Bypass signature check if it's a Swagger test.
  if (req.isSwaggerTest) {
    console.log('Swagger test detected, bypassing signature verification.');
    return next();
  }

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

// Export the function to be used in other files
module.exports = {
    IdentifyRequestOrigin,
    CheckSwagger,
    CheckGitHubSignature
};