
// Express server for handling API requests
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add a specific health check endpoint to better handle Railway's health checks
app.get('/', (req, res) => {
  console.log('Health check on root path');
  res.json({ status: 'online', message: 'AffTools API service is running' });
});

// Dedicated health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check on /health path');
  res.status(200).json({ status: 'healthy', message: 'Service is healthy' });
});

// Postback endpoint
app.get('/api/postback', async (req, res) => {
  try {
    console.log('Received postback request:', req.url);
    console.log('Query parameters:', req.query);
    
    // If no query parameters, this is a health check
    if (Object.keys(req.query).length === 0) {
      console.log('Health check on /api/postback path');
      return res.status(200).json({ 
        status: 'healthy', 
        message: 'Postback service is running correctly',
        success: true
      });
    }
    
    // Extract query parameters
    const { click_id, goal, payout } = req.query;
    
    if (!click_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: click_id',
        success: false
      });
    }
    
    // Process the postback locally
    console.log(`Processing postback for click_id=${click_id}, goal=${goal || 'conversion'}, payout=${payout || 'not provided'}`);
    
    // Forward to Supabase Edge Function if configured
    // This is optional - you can remove this if you want to process postbacks entirely on Railway
    const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL;
    if (SUPABASE_FUNCTION_URL) {
      try {
        console.log(`Forwarding postback to Supabase: ${SUPABASE_FUNCTION_URL}`);
        
        // Forward all query parameters to Supabase
        const queryString = new URLSearchParams(req.query).toString();
        const forwardUrl = `${SUPABASE_FUNCTION_URL}?${queryString}`;
        
        const response = await fetch(forwardUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('Supabase response:', data);
        
        // Return the Supabase response
        return res.json(data);
      } catch (supabaseError) {
        console.error('Error forwarding to Supabase:', supabaseError);
        // Continue with local processing if Supabase fails
      }
    }
    
    // Return success response if we didn't forward to Supabase or if forwarding failed
    return res.json({
      success: true,
      message: `Conversion recorded for click_id ${click_id}`,
      clickId: click_id,
      goal: goal || 'conversion'
    });
  } catch (error) {
    console.error('Error processing postback:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      success: false
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`AffTools API server running on port ${PORT}`);
});

module.exports = app;
