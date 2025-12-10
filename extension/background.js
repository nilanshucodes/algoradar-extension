const API_CONFIG ={
  BACKEND_URL: 'https://algoradar-extension.vercel.app/api/contests.js',
  CACHE_DURATION: 20 * 60 * 1000,
  MAX_RETRIES: 3
};

let retryCount = 0;

chrome.runtime.onInstalled.addListener(() => {
  console.log('AlgoRadar installed!');
  chrome.alarms.create('refreshContests',{periodInMinutes: 20});
  fetchAndCacheContests();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshContests'){
    fetchAndCacheContests();
  }
});

async function fetchAndCacheContests(forceRefresh = false){
  try{
    if (!forceRefresh) {
      const cached = await getCachedData();
      const age = Date.now() - (cached.timestamp || 0);
      if (cached.contests && age < API_CONFIG.CACHE_DURATION){
        console.log(`Using cache (${Math.floor(age / 1000)}s old)`);
        return cached.contests;
      }
    }
    
    console.log('Fetching from backend...');
    const response = await fetch(API_CONFIG.BACKEND_URL);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    const contests = data.contests || [];
    const processed = processContests(contests);
    
    await chrome.storage.local.set({
      contests: processed,
      timestamp: Date.now()
    });
    
    console.log(`Cached ${processed.length}contests`);
    retryCount = 0;
    return processed;
    
  } catch (error) {
    console.error('Error:',error);
    
    if (retryCount < API_CONFIG.MAX_RETRIES) {
      retryCount++;
      console.log(`Retry ${retryCount}/${API_CONFIG.MAX_RETRIES}`);
      await new Promise(r => setTimeout(r, 5000));
      return fetchAndCacheContests(forceRefresh);
    }
    
    const cached = await getCachedData();
    console.log('Using expired cache');
    return cached.contests || [];
  }
}

async function getCachedData(){
  const result = await chrome.storage.local.get(['contests', 'timestamp']);
  return {
    contests: result.contests || [],
    timestamp: result.timestamp || 0
  };
}

function processContests(contests){
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  
  return contests
    .map(c => {
      const start = new Date(c.start);
      const end = new Date(c.end);
      const startIST = new Date(start.getTime() + IST_OFFSET);
      const endIST = new Date(end.getTime() + IST_OFFSET);
      
      return{
        id: c.id,
        name: c.event,
        platform: c.resource,
        url: c.href,
        start: c.start,
        startDate: formatDate(startIST),
        startTime: formatTime(startIST),
        endTime: formatTime(endIST),
        startTimestamp: start.getTime()
      };
    })
    .filter(c => new Date(c.start) > now)
    .sort((a, b) => a.startTimestamp - b.startTimestamp);
}

function formatDate(date){
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function formatTime(date){
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContests') {
    getCachedData().then(data => {
      sendResponse({ contests: data.contests || [] });
    });
    return true;
  }
  
  if (request.action === 'refreshContests') {
    fetchAndCacheContests(true).then(contests => {
      sendResponse({ contests });
    });
    return true;
  }
});
