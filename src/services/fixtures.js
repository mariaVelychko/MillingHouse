const content = require('../data/content.json');

const PLACEHOLDER_SIZE = { width: 800, height: 800 };

function toPublicProduct(p) {
  const images = [...(p.images || [])].sort((a, b) => a.position - b.position);
  return {
    id: String(p.id),
    sku: p.sku,
    slug: p.slug,
    title: p.title,
    category: p.categorySlug,
    material: p.material,
    sizeInches: p.heightCm ? p.heightCm / 2.54 : null,
    heightCm: p.heightCm,
    widthCm: p.widthCm,
    description: p.description,
    images: images.map(i => 'img-' + i.id),
    ...(p.priceUah ? { price: { amount: p.priceUah, currency: 'UAH' } } : {}),
    ...(p.oldPriceUah ? { oldPrice: { amount: p.oldPriceUah, currency: 'UAH' } } : {}),
    inStock: p.inStock,
    colors: p.colors || [],
    specs: p.specs || [],
  };
}

function imageMedia(url, alt) {
  return {
    src: url, ...PLACEHOLDER_SIZE, alt,
    card: { src: url, width: 1000, height: 800 },
  };
}

function buildFixtures({ categories, products }) {
  const media = { ...content.media };
  const publicProducts = products.map(toPublicProduct);

  for (const p of products) {
    for (const img of p.images || []) media['img-' + img.id] = imageMedia(img.url, p.title);
  }

  const usedCategories = new Set(publicProducts.map(p => p.category));
  const publicCategories = categories.filter(c => usedCategories.has(c.slug)).map(c => {
    const first = products.find(p => p.categorySlug === c.slug && p.images?.length);
    const mediaId = 'cat-' + c.slug;
    const url = c.imageUrl || first?.images?.[0]?.url;
    if (url) media[mediaId] = imageMedia(url, c.title);
    return {
      id: c.slug, title: c.title, singular: c.singular, icon: c.icon,
      searchTerms: c.searchTerms, ...(url ? { image: mediaId, editorialImage: mediaId } : {}),
    };
  });

  return {
    media,
    site: { ...content.site, selectedProductSlugs: publicProducts.slice(0, 6).map(p => p.slug) },
    works: content.works,
    products: publicProducts,
    taxonomy: { categories: publicCategories, ...content.taxonomy },
  };
}

module.exports = { buildFixtures, toPublicProduct };
