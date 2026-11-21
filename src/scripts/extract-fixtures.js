const fs = require('fs');
const path = require('path');

globalThis.millinghouse = undefined;
require(path.join(__dirname, '../../design/prototype/assets/data/fixtures.js'));
const f = globalThis.millinghouse.fixtures;

const seed = {
  categories: f.taxonomy.categories,
  products: f.products,
};
const content = {
  media: f.media,
  site: f.site,
  works: f.works,
  taxonomy: { forms: f.taxonomy.forms, materials: f.taxonomy.materials, sizes: f.taxonomy.sizes },
};
fs.writeFileSync(path.join(__dirname, '../data/seed.json'), JSON.stringify(seed, null, 2));
fs.writeFileSync(path.join(__dirname, '../data/content.json'), JSON.stringify(content, null, 2));
console.log('OK: seed.json + content.json');
