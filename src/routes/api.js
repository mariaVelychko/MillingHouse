const express = require('express');
const catalog = require('../services/catalogService');

const router = express.Router();

router.get('/categories', async (req, res) => res.json(await catalog.listCategories()));

router.get('/products', async (req, res) => {
  const { category, q } = req.query;
  res.json(await catalog.listProducts({ category, q }));
});

router.get('/products/:slug', async (req, res) => {
  const product = await catalog.getProduct(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  res.json(product);
});

module.exports = router;
