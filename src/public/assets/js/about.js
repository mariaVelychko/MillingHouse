(async () => {
  'use strict';

  const { loadData, resolveImage } = globalThis.millinghouse['data'];
  const { figureImage, loadError } = globalThis.millinghouse['common'];
  const { initializePhotoGrid, photoGridHTML } = globalThis.millinghouse['gallery'];

  const hero = document.querySelector('#about-hero-image');
  const gallery = document.querySelector('#about-images');

  try {
    const [images, site] = await loadData('media', 'site');
    hero.innerHTML = figureImage(resolveImage(images, site.aboutImage ?? site.productionImage), {
      eager: true, sizes: '91vw',
    });
    const details = site.aboutImageIds.map(id => resolveImage(images, id)).filter(Boolean);
    gallery.innerHTML = photoGridHTML(details, 'Етапи роботи з деревом');
    initializePhotoGrid(gallery, details);
  } catch (error) {
    console.error(error);
    loadError(gallery);
  }
})();
