const express = require('express');

const imageList = row => [...(row.images ?? [])].sort((a, b) => a.position - b.position).map(image => image.url);
const productView = row => ({
  id: row.id, slug: row.slug, sku: row.sku, title: row.title, description: row.description, material: row.material,
  heightCm: row.heightCm, widthCm: row.widthCm, priceUah: row.priceUah, oldPriceUah: row.oldPriceUah,
  inStock: row.inStock, colors: row.colors, categorySlug: row.categorySlug, imageUrls: imageList(row),
});

module.exports = function adminRoutes(auth, service) {
  const router = express.Router();
  const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
  const idOf = req => (/^\d+$/.test(req.params.id) ? Number(req.params.id) : null);

  router.post('/login', auth.login);
  router.post('/logout', auth.logout);
  router.get('/me', auth.me);

  router.use(auth.requireAdmin); // усе нижче — лише для адміна

  router.get('/orders', wrap(async (req, res) => res.json(await service.listOrders())));
  router.patch('/orders/:number', wrap(async (req, res) => {
    const result = await service.setOrderStatus(req.params.number, req.body?.status);
    if (result.notFound) return res.status(404).json({ error: 'Замовлення не знайдено' });
    if (result.errors) return res.status(400).json({ errors: result.errors });
    res.json(result.order);
  }));

  router.get('/categories', wrap(async (req, res) => res.json(await service.listCategories())));
  router.get('/products', wrap(async (req, res) => res.json((await service.listProducts()).map(productView))));
  router.get('/products/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const product = id === null ? null : await service.getProduct(id);
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
    res.json(productView(product));
  }));
  router.post('/products', wrap(async (req, res) => {
    const result = await service.createProduct(req.body);
    if (result.errors) return res.status(400).json({ errors: result.errors });
    res.status(201).json(productView(result.product));
  }));
  router.put('/products/:id', wrap(async (req, res) => {
    const id = idOf(req);
    if (id === null) return res.status(404).json({ error: 'Товар не знайдено' });
    const result = await service.updateProduct(id, req.body);
    if (result.notFound) return res.status(404).json({ error: 'Товар не знайдено' });
    if (result.errors) return res.status(400).json({ errors: result.errors });
    res.json(productView(result.product));
  }));
  router.delete('/products/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const result = id === null ? { notFound: true } : await service.deleteProduct(id);
    if (result.notFound) return res.status(404).json({ error: 'Товар не знайдено' });
    res.status(204).end();
  }));

  return router;
};
