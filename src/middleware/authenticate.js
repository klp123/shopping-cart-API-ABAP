'use strict';

const authService = require('../services/authService');

/**
 * Middleware — validates a Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 *
 * Usage:
 *   router.get('/protected', authenticate, handler)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.slice(7); // strip "Bearer "
  try {
    req.user = authService.verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
