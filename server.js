'use strict';

require('dotenv').config();
const app = require('./src/app');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[server] Shopping Cart API running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

app.use(cors({
  origin: 'https://dkz8ljq6oozvy.cloudfront.net',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
