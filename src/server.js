// src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { extractVideoId, isValidYouTubeUrl } = require('./etl/url-parser');
const { RateLimiter } = require('./etl/rate-limiter');
const { fetchTranscript } = require('./etl/transcript-fetcher');
const { summarizeTranscript } = require('./ai/summarizer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Initialize rate limiters
const ipLimiter = new RateLimiter(10, 3600000); // 10 requests per hour
let globalRequestCount = 0;
const GLOBAL_LIMIT = 100;
let globalResetTime = Date.now() + 24 * 60 * 60 * 1000;

// Middleware for rate limiting
function checkRateLimits(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Reset global counter daily
  if (Date.now() > globalResetTime) {
    globalRequestCount = 0;
    globalResetTime = Date.now() + 24 * 60 * 60 * 1000;
  }
  
  // Check global limit
  if (globalRequestCount >= GLOBAL_LIMIT) {
    return res.status(429).json({ 
      error: 'Global daily limit reached. Please try again tomorrow.',
      retryAfter: Math.ceil((globalResetTime - Date.now()) / 1000)
    });
  }
  
  // Check IP limit
  if (!ipLimiter.isAllowed(clientIp)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Maximum 10 requests per hour.',
      limit: '10 per hour'
    });
  }
  
  // Record the request
  ipLimiter.recordRequest(clientIp);
  globalRequestCount++;
  
  next();
}

// Summarize endpoint
app.post('/api/summarize', checkRateLimits, async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate URL exists
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing URL',
        message: 'Please provide a "url" field in the request body'
      });
    }
    
    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid YouTube URL',
        message: 'Please provide a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)'
      });
    }
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Could not extract video ID',
        message: 'The URL appears to be YouTube but no video ID was found'
      });
    }
    
    // Fetch transcript
    let transcript;
    try {
      transcript = await fetchTranscript(videoId);
    } catch (error) {
      return res.status(404).json({
        error: 'No captions available',
        message: 'This video does not have captions or transcript. Try another video.'
      });
    }
    
    // Generate summary using LLM
    let summary;
    try {
      summary = await summarizeTranscript(transcript);
    } catch (error) {
      console.error('Summarization error:', error);
      return res.status(500).json({
        error: 'Summarization failed',
        message: 'Could not generate summary. Please try again.'
      });
    }
    
    // Return success response
    res.json({
      status: 'success',
      videoId,
      summary: summary.summary || summary.bullets,
      sentiment: summary.sentiment,
      takeaways: summary.takeaways,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'YouTube TL;DW Summarizer',
    version: '1.0.0',
    description: 'Get AI-powered summaries of YouTube videos',
    endpoints: ['POST /api/summarize', 'GET /health', 'GET /api/info'],
    limits: {
      perIp: '10 requests per hour',
      global: '100 requests per day'
    }
  });
});

// Serve the HTML UI for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error middleware:', err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: err.message 
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 YouTube Summarizer Server Running`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📝 POST /api/summarize - Submit YouTube URL`);
  console.log(`🌐 Web UI: http://localhost:${PORT}`);
  console.log(`❤️  GET /health - Health check\n`);
});

module.exports = app;