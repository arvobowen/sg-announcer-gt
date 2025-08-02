# GitHub Release to Microsoft Teams Bot

This is a simple and efficient Node.js application that listens for new GitHub releases and automatically posts formatted notifications to designated Microsoft Teams channels. It's designed to differentiate between full releases and pre-releases, routing notifications accordingly.

## ✨ Features

* **Real-time Notifications:** Uses GitHub webhooks to instantly detect when a new release is published.
* **Release & Pre-release Channels:** Intelligently sends notifications to separate Teams channels for official releases and pre-releases.
* **Richly Formatted Messages:** Posts clear and informative Adaptive Cards to Teams, including release name, author, repository, tag, and release notes.
* **Self-Hosted & Cost-Effective:** Runs on a private server, avoiding the need for third-party services or premium connectors.
* **Secure:** Manages secret webhook URLs safely using environment variables.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* [Node.js](https://nodejs.org/) (LTS version recommended)
* A code editor like [VS Code](https://code.visualstudio.com/)
* Webhook URLs from Microsoft Teams (see Configuration)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/KofileDev/github-teams-bot.git](https://github.com/KofileDev/github-teams-bot.git)
    cd github-teams-bot
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Configure your environment variables:**
    * Create a copy of the example environment file and name it `.env`.
        ```bash
        # On Windows
        copy .env.example .env
        
        # On macOS / Linux
        cp .env.example .env
        ```
    * Open the new `.env` file and add your secret webhook URLs from Microsoft Teams.

4.  **Run the development server:**
    This command uses `nodemon` to automatically restart the server when you save file changes.
    ```bash
    npm run dev
    ```
    Your server will be running at `http://localhost:3000`.

## ⚙️ Configuration

### Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

* `TEAMS_RELEASE_WEBHOOK_URL`: The full URL for the Incoming Webhook configured in your main "Releases" Teams channel.
* `TEAMS_PRERELEASE_WEBHOOK_URL`: The full URL for the Incoming Webhook configured in your "Pre-releases" Teams channel.

### GitHub Webhook Setup

1.  Navigate to your repository's **Settings > Webhooks**.
2.  Click **Add webhook**.
3.  **Payload URL:** Set this to the public URL of your running application (e.g., your ngrok URL for local testing, or your production server URL) followed by `/github-webhook`.
4.  **Content type:** Set to `application/json`.
5.  **Which events would you like to trigger this webhook?:** Select "Let me select individual events." and check **Releases**.
6.  Click **Add webhook**.

## Usage

Once the application is running and the GitHub webhook is configured, simply **publish a new release** in the monitored GitHub repository. The bot will automatically detect the event and post a notification to the appropriate Teams channel based on whether the "This is a pre-release" box was checked.