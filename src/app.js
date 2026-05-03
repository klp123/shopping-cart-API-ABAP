'use strict';

const express = require('express');
const cors    = require('cors');

const cartRouter     = require('./routes/cart.routes');
const productRouter  = require('./routes/product.routes');
const orderRouter    = require('./routes/order.routes');
const authRoutes     = require('./routes/auth.routes');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/v1/cart',      cartRouter);
app.use('/api/v1/orders',    orderRouter);
app.use('/api/v1/products',  productRouter);
app.use('/api/v1/auth',      authRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
