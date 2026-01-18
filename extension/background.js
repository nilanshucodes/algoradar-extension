const API_CONFIG ={
  BACKEND_URL: 'https://algoradar-extension.vercel.app/api/contests',
  CACHE_DURATION: 20 * 60 * 1000, 
  MAX_RETRIES: 3
};

let retryCount = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('refreshContests',{ periodInMinutes: 20 });
  fetchAndCacheContests();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshContests') {
    fetchAndCacheContests();
  }
});

async function fetchAndCacheContests(forceRefresh = false) {
  try {
    if (!forceRefresh) {
      const cached = await getCachedData();
      const age = Date.now() - (cached.timestamp || 0);

      if (cached.contests && cached.contests.length > 0 && age < API_CONFIG.CACHE_DURATION) {
        return cached.contests;
      }
    }

    console.log('Fetching from backend...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(API_CONFIG.BACKEND_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    const contests = data.contests || [];
    const processed = processContests(contests);
    await chrome.storage.local.set({
      contests: processed,
      timestamp: Date.now(),
      lastUpdated: data.lastUpdated
    });

    console.log(`Cached ${processed.length} contests (source: ${data.source || 'api'})`);
    retryCount = 0;
    return processed;

  } catch (error) {
    console.error('Fetch error:', error.message);

    if (retryCount < API_CONFIG.MAX_RETRIES) {
      retryCount++;
      await new Promise(r => setTimeout(r, 5000));
      return fetchAndCacheContests(forceRefresh);
    }

    const cached = await getCachedData();
    return cached.contests || [];
  }
}

async function getCachedData() {
  try {
    const result = await chrome.storage.local.get(['contests', 'timestamp', 'lastUpdated']);
    return {
      contests: result.contests || [],
      timestamp: result.timestamp || 0,
      lastUpdated: result.lastUpdated || null
    };
  } catch (error) {
    console.error('Storage error:', error);
    return { contests: [], timestamp: 0 };
  }
}

function ensureUTC(timeStr) {//timestamp is treated as UTC
  if (!timeStr) return null;
  
  // Already has timezone indicator
  if (timeStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  return timeStr + 'Z';
}

function processContests(contests) {//without manual IST offset
  const now = Date.now();

  return contests
    .map(c => {
      try {
        const startStr = ensureUTC(c.start);
        const endStr = ensureUTC(c.end);

        if (!startStr) return null;

        const startDate = new Date(startStr);
        const endDate = endStr ? new Date(endStr) : null;

        if (isNaN(startDate.getTime())) {
          console.error('Invalid start time:', c.start);
          return null;
        }

        return {
          id: c.id,
          name: c.event,
          platform: c.resource,
          url: c.href,
          start: startDate.toISOString(),
          startDate: formatDate(startDate), //Format in LOCAL timezone automatically
          startTime: formatTime(startDate),
          endTime: endDate ? formatTime(endDate) : '',
          startTimestamp: startDate.getTime()
        };
      } catch (error) {
        console.error('Error processing:', c.event, error);
        return null;
      }
    })
    .filter(c => c !== null && c.startTimestamp > now)
    .sort((a, b) => a.startTimestamp - b.startTimestamp);
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContests') {
    getCachedData().then(data => {
      const now = Date.now();
      const active = (data.contests || []).filter(c => c.startTimestamp > now);
      sendResponse({ contests: active, lastUpdated: data.lastUpdated });
    });
    return true;
  }

  if (request.action === 'refreshContests') {
    retryCount = 0;
    fetchAndCacheContests(true).then(contests => {
      sendResponse({ contests });
    });
    return true;
  }
});