//Backend for AlgoRadar extension
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject();

const CACHE_DURATION = 20 * 60 * 1000; 
const STALE_CACHE_DURATION = 24 * 60 * 60 * 1000; 
const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS_PER_IP = 20;

let contestCache = null;
let cacheTimestamp = 0;

let isRefreshing = false;
let refreshPromise = null;

const requestLog = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of requestLog.entries()) {
    const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, recent);
    }
  }
}, 60000);

export default async function handler(req, res) {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
  const now = Date.now();
  
  if (!requestLog.has(clientIp)) {
    requestLog.set(clientIp, []);
  }
  
  const recentRequests = requestLog.get(clientIp).filter(
    time => now - time < RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= MAX_REQUESTS_PER_IP) {
    console.log(`Rate limit: ${clientIp}`);
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: 60
    });
  }
  
  recentRequests.push(now);
  requestLog.set(clientIp, recentRequests);

  const cacheAge = now - cacheTimestamp;
  const isCacheFresh = contestCache && cacheAge < CACHE_DURATION;
  const isCacheStale = contestCache && cacheAge < STALE_CACHE_DURATION;

  if (isCacheFresh) {
    const responseTime = Date.now() - startTime;
    console.log(`Cache hit (${Math.floor(cacheAge / 1000)}s old) - ${responseTime}ms`);
    
    return res.status(200).json({
      contests: contestCache,
      cached: true,
      fresh: true,
      cacheAge: Math.floor(cacheAge / 1000),
      responseTime
    });
  }

  try {
    const contests = await fetchWithQueue();
    const responseTime = Date.now() - startTime;
    
    return res.status(200).json({
      contests: contests,
      cached: false,
      fresh: true,
      count: contests.length,
      responseTime
    });
  } catch (error) {
    console.error('Error:', error.message);
    
    if (isCacheStale) {
      return res.status(200).json({
        contests: contestCache,
        cached: true,
        stale: true,
        error: 'Failed to fetch fresh data',
        cacheAge: Math.floor(cacheAge / 1000)
      });
    }

    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Please try again later',
      contests: []
    });
  }
}

async function fetchWithQueue() {
  if (isRefreshing && refreshPromise) {
    console.log('⏳ Request queued');
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = fetchFromCLIST()
    .finally(() => {
      setTimeout(() => {
        isRefreshing = false;
        refreshPromise = null;
      }, 5000);
    });
  
  return refreshPromise;
}

async function fetchFromCLIST() {
  const apiKey = process.env.CLIST_API_KEY;
  const username = process.env.CLIST_USERNAME;
  
  if (!apiKey || !username) {
    throw new Error('API credentials not configured');
  }

  console.log('Fetching from CLIST API...');
  
  const url = `https://clist.by/api/v2/contest/?username=${username}&api_key=${apiKey}&upcoming=true&limit=500&order_by=start`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlgoRadar-Extension/1.0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('CLIST rate limit exceeded');
      }
      throw new Error(`CLIST API error: ${response.status}`);
    }

    const data = await response.json();
    const contests = data.objects || [];

    contestCache = contests;
    cacheTimestamp = Date.now();

    console.log(`Cached ${contests.length} contests`);
    return contests;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export const config = {
  maxDuration: 10
};