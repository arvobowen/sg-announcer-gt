/*
Summary: Handles incoming GitHub webhook release events.

Endpoint:
POST /api/v1/webhooks/github : GitHub Webhook Receiver (new release)
*/

const crypto = require('crypto');
const { createCardPayload } = require('../card-template');
const msTeams = require('../msteams-tools');

const handleGithubWebhook = async (req, res) => {
    req.log.message(`New incoming webhook request.\n\t${req.requestOrigin}`);

    // Check for Swagger UI bypass
    const referer = req.get('Referer') || '';
    const isSwaggerTest = referer.includes('/docs/') || referer.endsWith('/docs');

    const { release, repository, action } = req.body;
    const isPublishEvent = action === 'published' && release;

    // Strict Payload Validation
    let validationErrors = [];
    if (!release) {
        validationErrors.push("Missing release data (release) from payload.");
    } else {
        if (release.prerelease === null || release.prerelease === undefined)
            validationErrors.push("Missing release type. (release.prerelease)");
        if (release.prerelease !== null && release.prerelease !== undefined && typeof release.prerelease !== 'boolean')
            validationErrors.push("Release type (release.prerelease) value is malformed. Expected true/false.");
        if (!release.name)
            validationErrors.push("Missing release name. (release.name)");
        if (!release.body)
            validationErrors.push("Missing release's body. (release.body)");
        if (!release.html_url)
            validationErrors.push("Missing release's url (release.html_url).");
        if (!release.author) {
            validationErrors.push("Missing author data (release.author).");
        } else {
            if (!release.author.avatar_url)
                validationErrors.push("Missing author's avatar url (release.author.avatar_url).");
            if (!release.author.login)
                validationErrors.push("Missing author's account name (release.author.login).");
        }
    }

    if (!repository) {
        validationErrors.push("Missing repository data (repository).");
    } else {
        if (!repository.full_name)
            validationErrors.push("Missing repository's full name (repository.full_name).");
        if (!repository.visibility)
            validationErrors.push("Missing repository's visibility (repository.visibility).");
        if (!repository.html_url)
            validationErrors.push("Missing repository's url (repository.html_url).");
    }

    if (validationErrors.length > 0) {
        req.log.error(`Webhook validation failed:\n  ${validationErrors.join('\n  ')}`);
        return res.status(400).send(`Validation failed:\n  ${validationErrors.join('\n  ')}`);
    }

    // Determine the release type and the target webhook URL based on the release type
    const isBeta = release.prerelease;
    const targetWebhookUrl = isBeta
        ? process.env.TEAMS_PRERELEASE_WEBHOOK_URL
        : process.env.TEAMS_RELEASE_WEBHOOK_URL;
    const releaseType = isBeta ? "Beta" : "Production";
    const releaseInfo = `New ${releaseType} Release published: ${release.name} by ${release.author.login}`;

    // Create the payload for Microsoft Teams using the card template
    const payloadForTeams = createCardPayload(release, repository, releaseType);

    // Swagger Test Bypass
    if (isSwaggerTest) {
        req.log.message('Swagger test detected, bypassing signature verification.');
        req.log.message("Received a Swagger test event. Bypassing sending to Teams.");
        req.log.message(releaseInfo);

        return res.status(200).json({
            message: "Swagger test successful.",
            releaseInfo: releaseInfo,
            payloadForTeams: payloadForTeams
        });
    }

    // HMAC Verification & Real Processing (signature verification)
    try {
        req.log.message('Inspecting and verifying webhook signature...');
        const repoName = repository.full_name;
        const signature = req.get('X-Hub-Signature-256');
        if (!signature) {
            req.log.error(`No signature provided in GitHub webhook request for ${repoName}.`);
            return res.status(401).send('No signature provided');
        }

        const rawBodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body));
        const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
        const digest = 'sha256=' + hmac.update(rawBodyBuffer).digest('hex');

        const signatureBuffer = Buffer.from(signature);
        const digestBuffer = Buffer.from(digest);
        if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
            req.log.error(`Invalid webhook signature for repo: ${repoName}\n\tExpected: ${digest}\n\tReceived: ${signature}`);
            return res.status(401).send('Invalid signature');
        }

        // Signature is valid, proceed with processing the webhook
        req.log.message(`Valid signature for ${repoName}. Processing webhook...`);
        if (isPublishEvent) {
            req.log.message(`Received a GitHub Release event with a Publish action for a '${releaseType} Release'.  Sending to Teams.`);
            req.log.message(releaseInfo);

            // Send the notification to Microsoft Teams
            try {
                await msTeams.SendTeamsNotification(targetWebhookUrl, payloadForTeams);
                req.log.success(`Successfully sent ${releaseType} Release notification to Teams`);
                return res.status(200).send('Notification sent to Teams');
            } catch (error) {
                req.log.error(`Error sending ${releaseType} Release notification to Teams: ${error.message || error}`);
                return res.status(500).send('Error sending notification');
            }
        } else {
            req.log.message(`Received a non-supported action ('${action}'), ignoring.`);
            return res.status(200).send("Unsupported event received and ignored.");
        }
    } catch (error) {
        req.log.error(`Unhandled error while processing webhook request: ${error.message}`);
        return res.status(500).send('Internal server error');
    }
};

module.exports = {
    handleGithubWebhook
};