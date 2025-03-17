
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON body
app.use(express.json());

// Simple health check endpoint
app.get('/', (req, res) => {
  res.send('Affiliate Tools API is running');
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Postback endpoint that forwards to Supabase
app.get('/api/postback', async (req, res) => {
  try {
    console.log('Received postback request with query:', req.query);
    
    // If no parameters were provided, return success for health checks
    if (Object.keys(req.query).length === 0) {
      return res.status(200).json({ 
        status: 'healthy',
        message: 'Postback endpoint is working'
      });
    }
    
    // Get the Supabase URL and key from environment variables
    const supabaseProjectId = 'jruzfpymzkzegdhmzwsr';
    const supabaseFunctionUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback`;
    const anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXpmcHltemt6ZWdkaG16d3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NjM4MTIsImV4cCI6MjA1NzQzOTgxMn0.fo7-t2T6wbPAyzezvZgFjOmu4hEy3T9f4EpR4JxltL0';
    
    // Forward all query parameters to the Supabase Edge Function
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = `${supabaseFunctionUrl}?${queryString}`;
    
    console.log('Forwarding request to:', fullUrl);
    
    // Forward the request to Supabase with the anon key
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anon_key,
        'Authorization': `Bearer ${anon_key}`
      },
    });
    
    // Get the response from Supabase
    const data = await response.json();
    console.log('Received response from Supabase:', data);
    
    // Return the response to the client
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error processing postback:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
