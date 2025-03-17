
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

// Postback endpoint that forwards to Supabase
app.get('/api/postback', async (req, res) => {
  try {
    console.log('Received postback request with query:', req.query);
    
    // Get the Supabase URL and key from environment variables
    const supabaseProjectId = 'jruzfpymzkzegdhmzwsr';
    const supabaseFunctionUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback`;
    
    // Forward all query parameters to the Supabase Edge Function
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = `${supabaseFunctionUrl}?${queryString}`;
    
    console.log('Forwarding request to:', fullUrl);
    
    // Forward the request to Supabase
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
