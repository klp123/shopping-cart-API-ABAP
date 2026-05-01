'use strict';

const { z } = require('zod');

const createOrderSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  userId:    z.string().min(1, 'userId is required'),
});

module.exports = { createOrderSchema };
