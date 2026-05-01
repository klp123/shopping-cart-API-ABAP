'use strict';

const { ZodError } = require('zod');

/**
 * Middleware factory — validates req.body against a Zod schema.
 * Passes a structured 400 error to next() on failure.
 *
 * Usage:
 *   router.post('/route', validate(mySchema), handler)
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error:   'Validation failed',
          details: err.errors.map(e => ({
            field:   e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
