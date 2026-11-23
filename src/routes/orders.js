const express = require('express');

// Публічний вигляд замовлення: без зайвого (немає id й службових полів)
const toPublic = order => ({
  number: order.number, status: order.status, paymentStatus: order.paymentStatus,
  customerName: order.customerName, deliveryMethod: order.deliveryMethod, city: order.city, warehouse: order.warehouse,
  paymentMethod: order.paymentMethod, totalUah: order.totalUah, createdAt: order.createdAt,
  items: order.items.map(({ slug, title, unitPriceUah, quantity }) => ({ slug, title, unitPriceUah, quantity })),
});

module.exports = function ordersRoutes(orders) {
  const router = express.Router();
  const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

  router.post('/', wrap(async (req, res) => {
    const { errors, order } = await orders.createOrder(req.body);
    if (errors) return res.status(400).json({ errors });
    res.status(201).json(toPublic(order));
  }));

  router.get('/:number', wrap(async (req, res) => {
    const order = await orders.getOrder(req.params.number);
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });
    res.json(toPublic(order));
  }));

  return router;
};
