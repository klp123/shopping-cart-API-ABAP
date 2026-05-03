'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('./cartService');

const SECRET = process.env.JWT_SECRET || 'my-secret-key';
const AUTH_USER = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'secure-password',
};

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    SECRET,
    { expiresIn: '1h' }
  );
}

function authenticate(email, password) {
  if (email !== AUTH_USER.email || password !== AUTH_USER.password) {
    throw new AppError('Invalid credentials', 401);
  }

  return generateToken(AUTH_USER);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
}

module.exports = {
  authenticate,
  verifyToken,
  generateToken,
};
