const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Health check endpoint
app.get('/api/healthz', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.json({ status: 'ok' });
});

// Handle OPTIONS requests for CORS
app.options('/api/healthz', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`Health endpoint: http://localhost:${port}/api/healthz`);
});