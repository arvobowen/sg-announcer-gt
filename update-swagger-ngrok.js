// This script fetches the current ngrok public URL and updates the swagger.yaml file.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // Use the new, better library
const axios = require('axios');

const swaggerFilePath = path.join(__dirname, 'swagger.yaml');
const ngrokApiUrl = 'http://localhost:4040/api/tunnels';

async function updateSwaggerFile() {
  try {
    console.log('Fetching ngrok public URL...');
    // 1. Get the ngrok tunnel information
    const response = await axios.get(ngrokApiUrl);
    const tunnels = response.data.tunnels;

    // Find the https tunnel
    const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
    if (!httpsTunnel) {
      throw new Error('Could not find an active https ngrok tunnel. Is ngrok running?');
    }
    const ngrokUrl = httpsTunnel.public_url;
    console.log(`Found ngrok URL: ${ngrokUrl}`);

    // 2. Read and parse the existing swagger.yaml file using js-yaml
    const swaggerDocument = yaml.load(fs.readFileSync(swaggerFilePath, 'utf8'));

    // 3. Update the servers list
    const servers = swaggerDocument.servers || [];
    const ngrokServerIndex = servers.findIndex(server => server.description && server.description.toLowerCase().includes('ngrok'));

    const ngrokServerEntry = {
      url: ngrokUrl,
      description: 'ngrok Test Server (dynamic)',
    };

    if (ngrokServerIndex > -1) {
      // If an ngrok entry already exists, update it
      console.log('Updating existing ngrok server entry...');
      servers[ngrokServerIndex] = ngrokServerEntry;
    } else {
      // Otherwise, add a new one
      console.log('Adding new ngrok server entry...');
      servers.push(ngrokServerEntry);
    }
    swaggerDocument.servers = servers;

    // 4. Write the updated content back to the file using js-yaml's dump method
    // This method produces clean, correctly formatted YAML.
    const newSwaggerContent = yaml.dump(swaggerDocument);
    fs.writeFileSync(swaggerFilePath, newSwaggerContent, 'utf8');
    
    console.log('✅ swagger.yaml has been successfully updated!');

  } catch (error) {
    console.error(`❌ Error updating swagger file: ${error.message}`);
    console.error('   Please ensure ngrok is running before executing this script.');
    process.exit(1);
  }
}

updateSwaggerFile();
