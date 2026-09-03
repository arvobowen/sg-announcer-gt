/*
Summary: Dynamic route factory for mounting all third-party webhook endpoints.

Note: All third party webhooks (such as a webhook from GitHub) are hosted at /api/v1/webhooks and
handled differently than standard DocketSafe API calls.  They are created using a dynamic route generator
that maps the endpoint name to its specific handler function.  This allows for easy expansion to other
webhook sources in the future (e.g., Stripe, GitLab, etc.) without needing to create a new route for each one.
*/


// Import the specific webhook handlers for each service.  Each of these should point to a dedicated controller
// file in this same directory that implements the logic for that service's webhook.
const { handleGithubWebhook } = require('./github');
//const { handleStripeWebhook } = require('./stripe');


// Service-to-handler mapping for dynamic route generation.  Add new services here as needed.
const activeWebhooks = {
    'github': handleGithubWebhook
    //'stripe': handleStripeWebhook,
};


// Abstracted setup function to keep index.js clean.  This will dynamically create routes for each
// active webhook service setup in the activeWebhooks object.
const setupWebhookRoutes = (router) => {
    for (const [serviceName, handler] of Object.entries(activeWebhooks)) {
        router.post(`/api/v1/webhooks/${serviceName}`, handler);
    }
};

module.exports = {
    setupWebhookRoutes
};