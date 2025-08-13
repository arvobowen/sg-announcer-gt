const fs = require('fs');
const path = require('path');

// Define the path to our persistent storage file.
const statsFilePath = path.join(__dirname, 'stats.json');

// Function to read stats from the file.
const readStatsFromFile = () => {
  try {
    // If the file exists, read and parse it.
    if (fs.existsSync(statsFilePath)) {
      const data = fs.readFileSync(statsFilePath);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading stats file:', error);
  }
  // If the file doesn't exist or there's an error, return a default object.
  return { allTimeRequests: 0 };
};

// Initialize the stats object.
const stats = {
  sessionRequests: 0,
  startTime: new Date(),
  // Load the all-time count from the file on startup.
  allTimeRequests: readStatsFromFile().allTimeRequests,
};

// Function to write the all-time stats to the file.
const writeStatsToFile = () => {
  try {
    const dataToWrite = JSON.stringify({ allTimeRequests: stats.allTimeRequests });
    fs.writeFileSync(statsFilePath, dataToWrite);
  } catch (error) {
    console.error('Error writing to stats file:', error);
  }
};

/**
 * Increments both session and all-time request counters.
 */
function incrementRequestCount() {
  stats.sessionRequests++;
  stats.allTimeRequests++;
  // Save the new all-time count immediately.
  writeStatsToFile();
}

/**
 * Returns the current statistics object.
 * @returns {object} The statistics object.
 */
function getStats() {
  return stats;
}

module.exports = {
  incrementRequestCount,
  getStats,
};
