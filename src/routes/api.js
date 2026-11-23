const express = require('express');

// Фабрика маршрутів: сервіс каталогу підставляється ззовні
module.exports = function apiRoutes(catalog) {
  const router = express.Router();
  const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

  router.get('/categories', wrap(async (req, res) => res.json(await catalog.listCategories())));

  router.get('/products', wrap(async (req, res) => {
    const { category, q } = req.query;
    res.json(await catalog.listProducts({ category, q }));
  }));

  router.get('/products/:slug', wrap(async (req, res) => {
    const product = await catalog.getProduct(req.params.slug);
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
    res.json(product);
  }));

  return router;
};
