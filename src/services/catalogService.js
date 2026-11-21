const prisma = require('../lib/prisma');
const { buildFixtures, toPublicProduct } = require('./fixtures');

const withImages = { images: { orderBy: { position: 'asc' } } };

async function listProducts({ category, q } = {}) {
  const rows = await prisma.product.findMany({
    where: {
      ...(category ? { categorySlug: category } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: withImages,
    orderBy: { id: 'asc' },
  });
  return rows.map(toPublicProduct);
}

async function getProduct(slug) {
  const row = await prisma.product.findUnique({ where: { slug }, include: withImages });
  return row ? toPublicProduct(row) : null;
}

async function listCategories() {
  return prisma.category.findMany({ orderBy: { slug: 'asc' } });
}

async function buildSiteFixtures() {
  const [categories, products] = await Promise.all([
    listCategories(),
    prisma.product.findMany({ include: withImages, orderBy: { id: 'asc' } }),
  ]);
  return buildFixtures({ categories, products });
}

module.exports = { listProducts, getProduct, listCategories, buildSiteFixtures };
