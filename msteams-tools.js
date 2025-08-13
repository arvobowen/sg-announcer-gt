// msteams-tools.js
// This module provides tools for sending messages to Microsoft Teams using Adaptive Cards.

// Import necessary modules
const axios = require('axios');

// Helper function to send notifications
const SendTeamsNotification = (webhookUrl, message) => {
    if (!webhookUrl) {
        console.error('Teams webhook URL is not defined. Check your .env file.');
        return Promise.reject('Webhook URL not configured');
    }
    return axios.post(webhookUrl, message);
 };

 // Export the function to be used in other modules
 module.exports = {
    SendTeamsNotification,
 };