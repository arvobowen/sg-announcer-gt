document.addEventListener('DOMContentLoaded', () => {
    const sessionRequestsElem = document.getElementById('session-requests');
    const allTimeRequestsElem = document.getElementById('all-time-requests');
    const uptimeElem = document.getElementById('uptime-since');
  
    async function fetchAndUpdateStats() {
      try {
        const response = await fetch('/sg-announcer-gt/stats');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const stats = await response.json();
  
        if (sessionRequestsElem) {
          sessionRequestsElem.textContent = stats.sessionRequests;
        }
        if (allTimeRequestsElem) {
          allTimeRequestsElem.textContent = stats.allTimeRequests;
        }
        if (uptimeElem) {
          const startTime = new Date(stats.startTime);
          uptimeElem.textContent = `since ${startTime.toLocaleString()}`;
        }
  
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        if (sessionRequestsElem) sessionRequestsElem.textContent = 'N/A';
        if (allTimeRequestsElem) allTimeRequestsElem.textContent = 'N/A';
        if (uptimeElem) uptimeElem.textContent = 'Could not load data.';
      }
    }
  
    fetchAndUpdateStats();
    setInterval(fetchAndUpdateStats, 10000); // Refresh every 10 seconds
  });