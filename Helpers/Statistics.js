const fs = require('fs');
const path = require('path');
let statsFilePath;

const stats = {
  sessionRequests: 0,
  startTime: new Date(),
  allTimeRequests: readStatsFromFile().allTimeRequests,
};

// Utility function to create a folder if it doesn't exist
const createOrFindFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

// Utility function to create a file if it doesn't exist
const createOrFindFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ allTimeRequests: 0 }));
  }
  return filePath;
};

// Initializes the statistics tracking system
const initializeStatistics = (config) => {
  statsFilePath = path.join(config.TRACKING_STATS_PATH, 'ApiRequests.json');

  // Ensure the directory exists and create it if it doesn't
  createOrFindFolder(config.TRACKING_STATS_PATH);

  // Ensure the stats file exists and create it if it doesn't
  createOrFindFile(statsFilePath);

  // Initialize the allTimeRequests value from the file if it's not already set
  if (stats.allTimeRequests === null) {
    stats.allTimeRequests = readStatsFromFile().allTimeRequests;
  }
};

// Reads the statistics from the file and returns them as an object. If the file
// doesn't exist or an error occurs, returns default stats.
const readStatsFromFile = () => {
  try {
    const statsFilePath = path.join(req.orbConfig.TRACKING_STATS_PATH, 'ApiRequests.json');

    if (fs.existsSync(statsFilePath)) {
      const data = fs.readFileSync(statsFilePath);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading stats file:', error);
  }
  return { allTimeRequests: 0 };
};

// Writes the current statistics to the file. If an error occurs, it logs the error.
const writeStatsToFile = () => {
  try {
    const statsFilePath = path.join(req.orbConfig.TRACKING_STATS_PATH, 'ApiRequests.json');

    const dataToWrite = JSON.stringify({ allTimeRequests: stats.allTimeRequests });
    fs.writeFileSync(statsFilePath, dataToWrite);
  } catch (error) {
    console.error('Error writing to stats file:', error);
  }
};

// Increments the request count for both the current session and all-time requests
function incrementRequestCount() {
  stats.sessionRequests++;
  stats.allTimeRequests++;
  writeStatsToFile();
}

// Returns the current statistics object
function getStats() {
  return stats;
}

module.exports = {
  initializeStatistics,
  incrementRequestCount,
  getStats,
};