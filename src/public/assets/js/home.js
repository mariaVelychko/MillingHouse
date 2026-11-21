(async () => {
  'use strict';

  const { loadData, findInOrder, resolveImage } = globalThis.millinghouse['data'];
  const { categoryCard, loadError, media, mosaicCard, productCard } = globalThis.millinghouse['common'];

  const hero = document.querySelector('#hero-image');
  const production = document.querySelector('#production-image');
  const categories = document.querySelector('#home-categories');

  try {
    const [products, works, taxonomy, images, site] = await loadData('products', 'works', 'taxonomy', 'media', 'site');
    hero.innerHTML = media(resolveImage(images, site.heroImage), { eager: true, sizes: '(max-width: 700px) 100vw, 72vw' });
    production.innerHTML = media(resolveImage(images, site.productionImage), { sizes: '(max-width: 700px) 100vw, 70vw' });
    document.querySelector('#production-inset').innerHTML = media(resolveImage(images, site.productionInset), { sizes: '(max-width: 700px) 50vw, 31vw' });
    categories.innerHTML = taxonomy.categories.map(category => categoryCard(category, images)).join('');
    document.querySelector('#home-works').innerHTML = findInOrder(works, site.featuredWorkSlugs)
      .map((work, index) => mosaicCard(work, taxonomy, images, index === 0)).join('');
    const selection = findInOrder(products, site.selectedProductSlugs);
    document.querySelector('#home-products').innerHTML = selection
      .map(product => productCard(product, taxonomy, images)).join('');
  } catch (error) {
    console.error(error);
    loadError(categories);
  }
})();
