//AlgoRadar Extension UI Logic

import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject();

let allContests = [];

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const contestsList = document.getElementById('contestsList');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const timeFilter = document.getElementById('timeFilter');
const platformFilters = document.querySelectorAll('.platform-filter');

document.addEventListener('DOMContentLoaded', () => {
  loadContests();
  setupListeners();
});

function setupListeners() {
  refreshBtn.addEventListener('click', handleRefresh);
  retryBtn.addEventListener('click', handleRefresh);
  timeFilter.addEventListener('change', applyFilters);
  platformFilters.forEach(cb => cb.addEventListener('change', applyFilters));
}

// Load contests from background script
async function loadContests(force = false) {
  showLoading();
  
  try {
    const action = force ? 'refreshContests' : 'getContests';
    chrome.runtime.sendMessage({ action }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showError();
        return;
      }
      
      if (response && response.contests) {
        allContests = response.contests;
        applyFilters();
      } else {
        showError();
      }
    });
  } catch (error) {
    console.error('Error loading contests:', error);
    showError();
  }
}

// Apply platform and time filters
function applyFilters() {
  // Get selected platforms
  const selectedPlatforms = Array.from(platformFilters)
    .filter(cb => cb.checked)
    .map(cb => cb.value.toLowerCase());
  
  const timeValue = timeFilter.value;
  const now = new Date();
  
  // Filter contests
  let filtered = allContests.filter(contest => {
    // Platform filter
    const platformMatch = selectedPlatforms.length === 0 || 
      selectedPlatforms.some(p => contest.platform.toLowerCase().includes(p));
    
    if (!platformMatch) return false;
    
    // Time filter
    const contestDate = new Date(contest.start);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeValue === 'today') {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return contestDate >= today && contestDate < tomorrow;
    } else if (timeValue === 'week') {
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return contestDate >= today && contestDate < nextWeek;
    } else if (timeValue === 'month') {
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return contestDate >= today && contestDate < nextMonth;
    }
    
    return true; 
  });
  
  filtered = limitPerPlatform(filtered, 20);
  
  displayContests(filtered);
}

function limitPerPlatform(contests, limit) {
  const platformCounts = {};
  
  return contests.filter(contest => {
    const platform = contest.platform;
    platformCounts[platform] = (platformCounts[platform] || 0);
    
    if (platformCounts[platform] < limit) {
      platformCounts[platform]++;
      return true;
    }
    return false;
  });
}

function displayContests(contests) {
  hideAllStates();
  
  if (contests.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  contestsList.innerHTML = '';
  contestsList.style.display = 'block';
  
  contests.forEach(contest => {
    const card = createContestCard(contest);
    contestsList.appendChild(card);
  });
}

function createContestCard(contest) {
  const card = document.createElement('div');
  card.className = 'contest-card';
  card.onclick = () => window.open(contest.url, '_blank');
  
  const platformName = getPlatformName(contest.platform);
  const timeUntil = getTimeUntil(contest.start);
  
  card.innerHTML = `
    <div class="contest-header">
      <span class="contest-platform">${platformName}</span>
      <span class="contest-date">${contest.startDate}</span>
    </div>
    <div class="contest-name">${escapeHtml(contest.name)}</div>
    <div class="contest-time">
      <span> ${contest.startTime}</span>
      <span> ${timeUntil}</span>
    </div>
  `;
  
  return card;
}

function getPlatformName(platform) {
  const platformMap = {
    'codeforces.com': 'Codeforces',
    'atcoder.jp': 'AtCoder',
    'leetcode.com': 'LeetCode',
    'codechef.com': 'CodeChef',
    'kaggle.com': 'Kaggle',
    'topcoder.com': 'TopCoder',
    'hackerrank.com': 'HackerRank',
    'hackerearth.com': 'HackerEarth'
  };
  
  for (const [key, value] of Object.entries(platformMap)) {
    if (platform.toLowerCase().includes(key)) {
      return value;
    }
  }
  
  return platform;
}

function getTimeUntil(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start - now;
  
  if (diff < 0) return 'Started';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `in ${days}d ${hours}h`;
  } else if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else {
    return `in ${minutes}m`;
  }
}

async function handleRefresh() {
  refreshBtn.classList.add('spinning');
  await loadContests(true);
  
  setTimeout(() => {
    refreshBtn.classList.remove('spinning');
  }, 1000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  hideAllStates();
  loadingState.style.display = 'flex';
}

function showError() {
  hideAllStates();
  errorState.style.display = 'flex';
}

function hideAllStates() {
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  emptyState.style.display = 'none';
  contestsList.style.display = 'none';
}