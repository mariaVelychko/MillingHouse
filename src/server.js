require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

function createApp(catalog, { orders, clientDist = CLIENT_DIST } = {}) {
  const app = express();
  app.use(express.json());

  app.get('/api/site', async (req, res, next) => {
    try { res.json(await catalog.buildSiteFixtures()); } catch (e) { next(e); }
  });
  app.use('/api', require('./routes/api')(catalog));
  if (orders) app.use('/api/orders', require('./routes/orders')(orders));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Не знайдено' }));

  app.use(express.static(path.join(__dirname, 'public')));

  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/assets/') || path.extname(req.path)) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((req, res) => res.status(404).type('text').send('Не знайдено'));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  });
  return app;
}

module.exports = { createApp };

if (require.main === module) {
  const app = createApp(require('./services/catalogService'), { orders: require('./services/orderService') });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`MillingHouse: http://localhost:${PORT}`));
}