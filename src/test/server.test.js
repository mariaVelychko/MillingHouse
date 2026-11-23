const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server');
const { buildFixtures } = require('../services/fixtures');

const categories = [{ slug: 'lampy', title: 'Лампи', singular: 'Лампа', icon: 'star', searchTerms: [], imageUrl: null }];
const products = [{
  id: 1, sku: 'L-1', slug: 'zirka', title: 'Лампа Зірка', categorySlug: 'lampy', material: 'wood', heightCm: 25, widthCm: 10,
  description: 'Нічник', priceUah: 800, oldPriceUah: null, inStock: true, colors: [], specs: [],
  images: [{ id: 11, url: 'https://example.com/a.jpg', position: 0 }],
}];
const catalog = {
  buildSiteFixtures: async () => buildFixtures({ categories, products }),
  listCategories: async () => categories,
  listProducts: async () => products,
  getProduct: async slug => products.find(p => p.slug === slug) ?? null,
};

let server, base, dist;
before(async () => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-dist-'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
  server = createApp(catalog, { clientDist: dist }).listen(0);
  base = 'http://localhost:' + server.address().port;
});
after(() => { server.close(); fs.rmSync(dist, { recursive: true, force: true }); });

test('/api/site віддає фікстури з товарами з БД', async () => {
  const data = await (await fetch(base + '/api/site')).json();
  assert.equal(data.products.length, 1);
  assert.equal(data.products[0].price.amount, 800);
  assert.equal(data.products[0].sizeInches, 25 / 2.54);
  assert.deepEqual(data.taxonomy.categories.map(c => c.id), ['lampy']);
  assert.ok(data.media['img-11']);
});

test('/api/products/:slug: знайдено і 404', async () => {
  assert.equal((await fetch(base + '/api/products/zirka')).status, 200);
  assert.equal((await fetch(base + '/api/products/nemaye')).status, 404);
});

test('невідомий /api/... дає JSON 404', async () => {
  const res = await fetch(base + '/api/xyz');
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Не знайдено' });
});

test('клієнтські маршрути віддають index.html (SPA fallback)', async () => {
  for (const url of ['/', '/catalog', '/product/zirka', '/cart']) {
    const res = await fetch(base + url);
    assert.equal(res.status, 200, url);
    assert.match(await res.text(), /id="root"/);
  }
});

test('відсутній файл у /assets дає 404, а не index.html', async () => {
  assert.equal((await fetch(base + '/assets/css/nemaye.css')).status, 404);
});

test('статика стилів віддається', async () => {
  const res = await fetch(base + '/assets/css/site.css');
  assert.equal(res.status, 200);
});

test('помилка каталогу -> 500 JSON', async () => {
  const bad = createApp({ ...catalog, buildSiteFixtures: async () => { throw new Error('db'); } }, { clientDist: dist }).listen(0);
  const origError = console.error; console.error = () => {};
  const res = await fetch('http://localhost:' + bad.address().port + '/api/site');
  console.error = origError; bad.close();
  assert.equal(res.status, 500);
});
