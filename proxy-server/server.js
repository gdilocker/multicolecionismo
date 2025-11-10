import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dynadot Proxy is running' });
});

// Proxy endpoint for Dynadot API
app.post('/api/dynadot', async (req, res) => {
  try {
    const { command, params } = req.body;

    // Validate required fields
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Get API key from environment
    const apiKey = process.env.DYNADOT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Dynadot API key not configured' });
    }

    // Build Dynadot API URL
    const baseUrl = 'https://api.dynadot.com/api3.json';
    const urlParams = new URLSearchParams({
      key: apiKey,
      command: command,
      ...params
    });

    const dynadotUrl = `${baseUrl}?${urlParams.toString()}`;

    console.log(`[${new Date().toISOString()}] Proxying request to Dynadot: ${command}`);

    // Forward request to Dynadot
    const response = await fetch(dynadotUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Dynadot-Proxy/1.0'
      }
    });

    const data = await response.json();

    // Log response status
    console.log(`[${new Date().toISOString()}] Dynadot response: ${data.Status || 'unknown'}`);

    // Return Dynadot response
    res.json(data);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dynadot Proxy running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
