'use strict';

const { ZodError } = require('zod');

/**
 * Global Express error handler.
 * Must be mounted LAST in app.js — after all routes.
 *
 * Handles:
 *  - AppError  (custom, has .statusCode)
 *  - ZodError  (validation — 400)
 *  - Generic   (unknown — 500)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Custom AppError (business rule violations, 404s, etc.)
  if (err.name === 'AppError') {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  // Zod validation error (schema parse called outside middleware)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error:   'Validation failed',
      details: err.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Unknown / unhandled error
  console.error('[errorHandler]', err);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
