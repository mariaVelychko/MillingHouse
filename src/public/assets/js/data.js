(() => {
  'use strict';

  async function loadData(...names) {
    const { fixtures } = globalThis.millinghouse;
    return names.map(name => {
      if (!Object.hasOwn(fixtures, name)) throw new Error('Fixture unavailable: ' + name);
      return fixtures[name];
    });
  }

  function findInOrder(records, slugs) {
    const bySlug = new Map(records.map(record => [record.slug, record]));
    return slugs.map(slug => bySlug.get(slug)).filter(Boolean);
  }

  function categoryInfo(taxonomy, id) {
    return taxonomy.categories.find(category => category.id === id);
  }

  function resolveImage(images, id) {
    const image = images[id];
    if (!image) return null;
    if (!image.from) return image.src ? image : null;
    const base = images[image.from];
    return base?.src ? { ...base, ...image } : null;
  }

  function recordImages(record, images) {
    return (record.images ?? []).map(id => resolveImage(images, id)).filter(Boolean);
  }

  globalThis.millinghouse['data'] = {
    loadData,
    findInOrder,
    categoryInfo,
    resolveImage,
    recordImages,
  };
})();
