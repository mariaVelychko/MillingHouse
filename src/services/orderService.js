const prisma = require('../lib/prisma');
const { validateOrderInput, priceOrder, orderNumber } = require('./orderLogic');

// Створення замовлення: перевірка -> ціни з БД -> запис у транзакції.
// Повертає { errors } (400) або { order }.
async function createOrder(body) {
  const { errors, value } = validateOrderInput(body);
  if (Object.keys(errors).length) return { errors };

  const products = await prisma.product.findMany({ where: { slug: { in: value.items.map(item => item.slug) } } });
  const priced = priceOrder(value.items, products);
  if (priced.error) return { errors: { items: priced.error } };

  const order = await prisma.$transaction(async tx => {
    const created = await tx.order.create({
      data: {
        number: 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        customerName: value.customerName, phone: value.phone, email: value.email, comment: value.comment,
        deliveryMethod: value.deliveryMethod, city: value.city, warehouse: value.warehouse,
        paymentMethod: value.paymentMethod, totalUah: priced.total,
        items: { create: priced.lines },
      },
    });
    return tx.order.update({
      where: { id: created.id }, data: { number: orderNumber(created.id, created.createdAt) },
      include: { items: true },
    });
  });
  return { order };
}

async function getOrder(number) {
  return prisma.order.findUnique({ where: { number }, include: { items: true } });
}

module.exports = { createOrder, getOrder };
