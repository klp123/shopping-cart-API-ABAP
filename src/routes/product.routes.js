'use strict';

const express        = require('express');
const productService = require('../services/odataService');
const authenticate   = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/v1/products
 * Fetch products from OData (SAP)
 * Query params (all optional):
 *   ?category=Electronics   — filter by category
 *   ?minPrice=500           — price greater than value
 *   ?maxPrice=3000          — price less than value
 *   ?limit=5                — max number of results ($top)
 *   ?skip=10                — number of results to skip ($skip)
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, limit, skip } = req.query;
    const { count, products } = await productService.fetchProductsFromOData({ category, minPrice, maxPrice, limit, skip });
    res.status(200).json({ count, products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
