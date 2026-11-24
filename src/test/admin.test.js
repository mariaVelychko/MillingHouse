const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server');
const { createAdminAuth, createToken, verifyToken } = require('../lib/adminAuth');
const { slugify, validateProductInput } = require('../services/adminLogic');

test('slugify транслітерує українську', () => {
  assert.equal(slugify('Лампа «Зірка» E27, 25 см'), 'lampa-zirka-e27-25-sm');
  assert.equal(slugify("Об'єм"), 'obiem');
  assert.equal(slugify('!!!'), '');
});

test('токен: підпис, термін дії, підробка', () => {
  const token = createToken('s', 1000);
  assert.equal(verifyToken(token, 's', 2000), true);
  assert.equal(verifyToken(token, 'other', 2000), false);
  assert.equal(verifyToken(token, 's', 1000 + 9 * 3600 * 1000), false);
  assert.equal(verifyToken('9999999999999.fake', 's', 0), false);
  assert.equal(verifyToken(undefined, 's'), false);
});

test('перевірка товару: slug з назви, помилки полів', () => {
  const ok = validateProductInput({ title: 'Лампа Зірка', categorySlug: 'lampy', priceUah: '800', imageUrls: ['https://a.ua/1.jpg'] });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.slug, 'lampa-zirka');
  assert.equal(ok.value.priceUah, 800);
  const bad = validateProductInput({ title: '', categorySlug: '', priceUah: '-5', heightCm: 'abc', imageUrls: ['javascript:alert(1)'] });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['categorySlug', 'heightCm', 'imageUrls', 'priceUah', 'slug', 'title']);
});

// ---- HTTP з фейковим сервісом
let server, base, dist, products, orders;
const service = {
  listOrders: async () => orders,
  setOrderStatus: async (number, status) => {
    if (!['new', 'shipped'].includes(status)) return { errors: { status: 'Невідомий статус.' } };
    const order = orders.find(o => o.number === number);
    if (!order) return { notFound: true };
    order.status = status; return { order };
  },
  listCategories: async () => [{ slug: 'lampy', title: 'Лампи' }],
  listProducts: async () => products,
  getProduct: async id => products.find(p => p.id === id) ?? null,
  createProduct: async body => {
    const { errors, value } = validateProductInput(body);
    if (Object.keys(errors).length) return { errors };
    const { imageUrls, ...rest } = value;
    const product = { id: products.length + 1, ...rest, images: imageUrls.map((url, position) => ({ url, position })) };
    products.push(product); return { product };
  },
  updateProduct: async () => ({ notFound: true }),
  deleteProduct: async id => { const i = products.findIndex(p => p.id === id); if (i < 0) return { notFound: true }; products.splice(i, 1); return { ok: true }; },
};

before(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-dist-'));
  products = []; orders = [{ number: 'MH-1', status: 'new', items: [] }];
  const auth = createAdminAuth({ login: 'admin', password: 'pass123', secret: 'test-secret' });
  server = createApp({ buildSiteFixtures: async () => ({}) }, { admin: { auth, service }, clientDist: dist }).listen(0);
  base = 'http://localhost:' + server.address().port;
});
after(() => { server.close(); fs.rmSync(dist, { recursive: true, force: true }); });

const call = (url, { method = 'GET', body, cookie } = {}) => fetch(base + url, {
  method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined,
});
async function login(l = 'admin', p = 'pass123') {
  const res = await call('/api/admin/login', { method: 'POST', body: { login: l, password: p } });
  return { res, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] };
}

test('без входу адмін-маршрути дають 401', async () => {
  for (const url of ['/api/admin/orders', '/api/admin/products', '/api/admin/categories']) assert.equal((await call(url)).status, 401, url);
  assert.equal((await call('/api/admin/products', { method: 'POST', body: {} })).status, 401);
  assert.equal((await call('/api/admin/products/1', { method: 'DELETE' })).status, 401);
});

test('підроблений cookie не пускає', async () => {
  assert.equal((await call('/api/admin/orders', { cookie: 'mh_admin=9999999999999.fake' })).status, 401);
});

test('невірний пароль -> 401 без cookie', async () => {
  const { res } = await login('admin', 'wrong');
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('set-cookie'), null);
});

test('вхід ставить HttpOnly SameSite=Strict cookie, далі доступ є', async () => {
  const { res, cookie } = await login();
  assert.equal(res.status, 200);
  const header = res.headers.get('set-cookie');
  assert.match(header, /HttpOnly/); assert.match(header, /SameSite=Strict/);
  assert.equal((await call('/api/admin/orders', { cookie })).status, 200);
  assert.deepEqual(await (await call('/api/admin/me', { cookie })).json(), { admin: true, configured: true });
  assert.deepEqual(await (await call('/api/admin/me')).json(), { admin: false, configured: true });
});

test('вихід скидає cookie', async () => {
  const { cookie } = await login();
  const res = await call('/api/admin/logout', { method: 'POST', cookie });
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
});

test('замовлення: зміна статусу, невідомий статус, невідомий номер', async () => {
  const { cookie } = await login();
  const ok = await call('/api/admin/orders/MH-1', { method: 'PATCH', body: { status: 'shipped' }, cookie });
  assert.equal(ok.status, 200); assert.equal((await ok.json()).status, 'shipped');
  assert.equal((await call('/api/admin/orders/MH-1', { method: 'PATCH', body: { status: 'xxx' }, cookie })).status, 400);
  assert.equal((await call('/api/admin/orders/NOPE', { method: 'PATCH', body: { status: 'new' }, cookie })).status, 404);
});

test('товари: створення, помилки, видалення, 404', async () => {
  const { cookie } = await login();
  const created = await call('/api/admin/products', { method: 'POST', cookie, body: { title: 'Лампа Місяць', categorySlug: 'lampy', priceUah: 450, imageUrls: ['https://a.ua/m.jpg'] } });
  assert.equal(created.status, 201);
  const product = await created.json();
  assert.equal(product.slug, 'lampa-misiats');
  assert.deepEqual(product.imageUrls, ['https://a.ua/m.jpg']);
  assert.equal((await call('/api/admin/products', { method: 'POST', cookie, body: { title: '' } })).status, 400);
  assert.equal((await call('/api/admin/products/abc', { cookie })).status, 404);
  assert.equal((await call('/api/admin/products/' + product.id, { method: 'DELETE', cookie })).status, 204);
  assert.equal((await call('/api/admin/products/' + product.id, { method: 'DELETE', cookie })).status, 404);
});

test('запит з чужого Origin на зміну відхиляється', async () => {
  const { cookie } = await login();
  const res = await fetch(base + '/api/admin/orders/MH-1', {
    method: 'PATCH', headers: { 'content-type': 'application/json', cookie, origin: 'https://evil.example' }, body: JSON.stringify({ status: 'new' }),
  });
  assert.equal(res.status, 403);
});

test('після 5 невдалих спроб вхід блокується', async () => {
  const auth = createAdminAuth({ login: 'a', password: 'b', secret: 's' });
  const app = createApp({ buildSiteFixtures: async () => ({}) }, { admin: { auth, service }, clientDist: dist }).listen(0);
  const url = 'http://localhost:' + app.address().port + '/api/admin/login';
  const attempt = p => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login: 'a', password: p }) });
  for (let i = 0; i < 5; i++) assert.equal((await attempt('x')).status, 401);
  assert.equal((await attempt('b')).status, 429); // навіть правильний пароль заблоковано
  app.close();
});

test('без налаштованих логіна й пароля вхід вимкнено', async () => {
  const auth = createAdminAuth({});
  const app = createApp({ buildSiteFixtures: async () => ({}) }, { admin: { auth, service }, clientDist: dist }).listen(0);
  const res = await fetch('http://localhost:' + app.address().port + '/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 503);
  app.close();
});
