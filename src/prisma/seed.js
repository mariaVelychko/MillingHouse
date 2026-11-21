// Заповнює БД категоріями та лампами. Запуск: npm run seed
const categories = require('../data/categories.json');
const lamps = require('../data/lamps.json');
const prisma = require('../lib/prisma');

async function main() {
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  for (const l of lamps) {
    await prisma.product.create({
      data: {
        sku: l.sku, slug: l.slug, title: l.title, description: l.description,
        material: l.material === 'пластик' ? 'plastic' : null,
        heightCm: l.heightCm, widthCm: l.widthCm,
        priceUah: l.priceUah, oldPriceUah: l.oldPriceUah,
        inStock: l.inStock, colors: l.colors, specs: l.specs,
        categorySlug: 'lampy',
        images: { create: l.images.map((url, position) => ({ url, position })) },
      },
    });
  }
  console.log(`Seed OK: ${categories.length} категорій, ${lamps.length} ламп`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
