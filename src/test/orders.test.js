const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server');
const { validateOrderInput, priceOrder, orderNumber, normalizePhone } = require('../services/orderLogic');

const valid = {
  customerName: 'Марія', phone: '067 123 45 67', email: 'm@a.ua', deliveryMethod: 'nova_poshta',
  city: 'Київ', warehouse: 'Відділення №1', paymentMethod: 'cod', items: [{ slug: 'zirka', qty: 2 }],
};

test('телефон нормалізується', () => {
  assert.equal(normalizePhone('067 123 45 67'), '+380671234567');
  assert.equal(normalizePhone('+380671234567'), '+380671234567');
  assert.equal(normalizePhone('12345'), '');
});

test('коректне замовлення проходить перевірку', () => {
  const { errors, value } = validateOrderInput(valid);
  assert.deepEqual(errors, {});
  assert.equal(value.phone, '+380671234567');
  assert.deepEqual(value.items, [{ slug: 'zirka', qty: 2 }]);
});

test('помилки по полях', () => {
  const { errors } = validateOrderInput({ customerName: '', phone: '1', email: 'x', deliveryMethod: 'nova_poshta', paymentMethod: 'bitcoin', items: [] });
  assert.deepEqual(Object.keys(errors).sort(), ['city', 'customerName', 'email', 'items', 'paymentMethod', 'phone', 'warehouse'].sort());
});

test('самовивіз не вимагає адреси, а адреса скидається', () => {
  const { errors, value } = validateOrderInput({ ...valid, deliveryMethod: 'pickup', city: 'Київ' });
  assert.deepEqual(errors, {});
  assert.equal(value.city, null);
});

test('однакові товари об’єднуються, кількість обмежена', () => {
  const { value } = validateOrderInput({ ...valid, items: [{ slug: 'a', qty: 60 }, { slug: 'a', qty: 60 }] });
  assert.deepEqual(value.items, [{ slug: 'a', qty: 99 }]);
  assert.ok(validateOrderInput({ ...valid, items: [{ slug: 'a', qty: 0 }] }).errors.items);
  assert.ok(validateOrderInput({ ...valid, items: [{ slug: 'a', qty: 1.5 }] }).errors.items);
});

test('сума рахується за цінами з БД', () => {
  const products = [{ id: 1, slug: 'zirka', title: 'Зірка', priceUah: 800, inStock: true }];
  const r = priceOrder([{ slug: 'zirka', qty: 2 }], products);
  assert.equal(r.total, 1600);
  assert.equal(r.lines[0].unitPriceUah, 800);
  assert.ok(priceOrder([{ slug: 'x', qty: 1 }], products).error);
  assert.ok(priceOrder([{ slug: 'zirka', qty: 1 }], [{ ...products[0], inStock: false }]).error);
  assert.ok(priceOrder([{ slug: 'zirka', qty: 1 }], [{ ...products[0], priceUah: null }]).error);
});

test('номер замовлення', () => {
  assert.equal(orderNumber(7, new Date(2026, 10, 23)), 'MH-261123-0007');
});

// --- HTTP ---
let server, base, dist, saved;
before(async () => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-dist-'));
  saved = [];
  const products = [{ id: 1, slug: 'zirka', title: 'Зірка', priceUah: 800, inStock: true }];
  const { validateOrderInput: v, priceOrder: p, orderNumber: n } = require('../services/orderLogic');
  const orders = {
    async createOrder(body) {
      const { errors, value } = v(body);
      if (Object.keys(errors).length) return { errors };
      const priced = p(value.items, products);
      if (priced.error) return { errors: { items: priced.error } };
      const order = { id: saved.length + 1, ...value, status: 'new', paymentStatus: 'pending', totalUah: priced.total, createdAt: new Date(), items: priced.lines };
      order.number = n(order.id, order.createdAt);
      saved.push(order);
      return { order };
    },
    async getOrder(number) { return saved.find(o => o.number === number) ?? null; },
  };
  server = createApp({ buildSiteFixtures: async () => ({}) }, { orders, clientDist: dist }).listen(0);
  base = 'http://localhost:' + server.address().port;
});
after(() => { server.close(); fs.rmSync(dist, { recursive: true, force: true }); });

const post = body => fetch(base + '/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('POST /api/orders створює замовлення, ігноруючи ціну з браузера', async () => {
  const res = await post({ ...valid, totalUah: 1, items: [{ slug: 'zirka', qty: 2, price: 1 }] });
  assert.equal(res.status, 201);
  const order = await res.json();
  assert.equal(order.totalUah, 1600);
  assert.match(order.number, /^MH-\d{6}-0001$/);
  assert.equal('phone' in order, false); // телефон у публічну відповідь не потрапляє
});

test('POST /api/orders: помилки валідації -> 400', async () => {
  const res = await post({ ...valid, customerName: '' });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.customerName);
});

test('POST /api/orders: невідомий товар -> 400', async () => {
  const res = await post({ ...valid, items: [{ slug: 'nemaye', qty: 1 }] });
  assert.equal(res.status, 400);
});

test('GET /api/orders/:number', async () => {
  const { number } = await (await post(valid)).json();
  assert.equal((await fetch(base + '/api/orders/' + number)).status, 200);
  assert.equal((await fetch(base + '/api/orders/MH-000000-0000')).status, 404);
});
