require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

// Фабрика застосунку: каталог передається ззовні, тому сервер легко тестувати без БД
function createApp(catalog, { clientDist = CLIENT_DIST } = {}) {
  const app = express();
  app.use(express.json());

  // Усі дані для React-клієнта одним запитом: товари, категорії, зображення, контент
  app.get('/api/site', async (req, res, next) => {
    try { res.json(await catalog.buildSiteFixtures()); } catch (e) { next(e); }
  });
  app.use('/api', require('./routes/api')(catalog));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Не знайдено' }));

  // Стилі, шрифти й зображення (спільні для React-клієнта)
  app.use(express.static(path.join(__dirname, 'public')));

  // Зібраний React (npm run build у client/). Будь-який інший GET віддає index.html —
  // далі маршрутизацію виконує React Router.
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
  const app = createApp(require('./services/catalogService'));
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`MillingHouse: http://localhost:${PORT}`));
}
