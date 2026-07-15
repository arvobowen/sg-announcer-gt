## 🎯 About This Orb (Announcer - GitHub to Teams)

This is an orb designed for the **[SpiderGate API Server](https://github.com/arvobowen/spider-gate)**. Its purpose is to provide a webhook endpoint that listens for release events from GitHub repositories and posts richly formatted notification cards to designated Microsoft Teams channels.

This is a SpiderGate Orb that requires the dependancy `spider-gate` to run.	 A simple and efficient Node.js application that listens for new GitHub releases and automatically posts formatted notifications to designated Microsoft Teams channels. It's designed to differentiate between full releases and pre-releases, routing notifications accordingly.

---

<div align="center">
	<img src="https://raw.githubusercontent.com/arvobowen/sg-announcer-gt/main/assets/logo.png" alt="Announcer Orb Logo" width="150"/>
</div>

<h1 align="center">Announcer Orb: GitHub to Teams</h1>

<div align="center">
	A SpiderGate Orb that listens for new GitHub releases and sends formatted notifications to Microsoft Teams channels.
</div>

<div align="center">

![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs)
![License](https://img.shields.io/badge/License-CC--BY--NC--SA--4.0-blue?style=for-the-badge)

</div>

---

## ✨ Features

* ✅ **Real-time Notifications:** Uses GitHub webhooks to instantly detect when a new release is published.
* ✅ **Release & Pre-release Channels:** Intelligently sends notifications to separate Teams channels for official releases and pre-releases.
* ✅ **Richly Formatted Messages:** Posts clear and informative Adaptive Cards to Teams, including release name, author, repository, tag, and release notes.
* ✅ **Secure:** Verifies incoming webhook payloads using a shared secret to ensure authenticity.
* ✅ **Interactive Documentation:** Includes a Swagger UI page for easy testing and documentation.

---

## 🎬 Demonstration

![Demo](https://raw.githubusercontent.com/arvobowen/sg-announcer-gt/main/assets/demo.png)
![Demo New Card](https://raw.githubusercontent.com/arvobowen/sg-announcer-gt/main/assets/demo-new-card-design.png)

---

## ⚡ Quick setup with npm package manager

If you have already installed SpiderGate and want to install this orb you can use the following commands:

```bash
sudo -i -u spidergate
cd ~/server
npx spidergate add sg-announcer-gt
```

To update to the latest version of that orb you can use the commands:

```bash
sudo -i -u spidergate
cd ~/server
npm update sg-announcer-gt
```

## 🚀 Getting Started with SpiderGate

This project is not a standalone application. It is designed to be run as a module within the **[SpiderGate API Server](https://github.com/arvobowen/spider-gate)**. Please follow the instructions in that repository for setup and installation.

### Configuration

To use this orb, you will need to add the following environment variables to your main server's `.env` file:

* `TEAMS_RELEASE_WEBHOOK_URL`: The full URL for the Incoming Webhook configured in your main "Releases" Teams channel.
* `TEAMS_PRERELEASE_WEBHOOK_URL`: The full URL for the Incoming Webhook configured in your "Pre-releases" Teams channel.
* `WEBHOOK_SECRET`: The strong, random string you created to secure your webhook payloads.

---

## 🧪 Testing Changes Pipeline

1. **Open Orb:** Open the `sg-announcer-gt` source code repository in your VSCode editor and edit your `index.js` file (or any other required files).
2. **Open SpiderGate:** Open the `spider-gate` source code repository in a separate VSCode window.
3. **Open Terminal:** Open the integrated terminal in the SpiderGate VSCode window using `Ctrl` + `\`` (Control + Backtick).
4. **Link Orb:** Type the command `npm run link sg-announcer-gt` to automatically create the symlink and connect your local orb to the core server.
5. **Start Server:** Run `npm run dev` in the SpiderGate terminal to start the server. This will dynamically load your linked orb so you can test it locally.