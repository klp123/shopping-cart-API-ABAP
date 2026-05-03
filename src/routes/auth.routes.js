'use strict';

const express = require('express');
const authService = require('../services/authService');
const validate = require('../middleware/validate');
const { loginSchema } = require('../schemas/auth.schemas');

const router = express.Router();

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return a JWT token.
 */
router.post('/login', validate(loginSchema), (req, res, next) => {
  try {
    const token = authService.authenticate(req.body.email, req.body.password);
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
