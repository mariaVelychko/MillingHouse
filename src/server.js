require('dotenv').config();
const path = require('path');
const express = require('express');
const catalog = require('./services/catalogService');
const apiRoutes = require('./routes/api');

const app = express();

  app.get('/assets/data/fixtures.js', async (req, res, next) => {
  try {
    const fixtures = await catalog.buildSiteFixtures();
    res.type('application/javascript').send(
      'globalThis.millinghouse = { fixtures: ' + JSON.stringify(fixtures) + ' };'
    );
  } catch (e) { next(e); }
});

app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Помилка сервера' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`MillingHouse: http://localhost:${PORT}`));
}
module.exports = app;
