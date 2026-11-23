export function findInOrder(records, slugs = []) {
  const bySlug = new Map(records.map(record => [record.slug, record]));
  return slugs.map(slug => bySlug.get(slug)).filter(Boolean);
}

export const categoryInfo = (taxonomy, id) => taxonomy.categories.find(category => category.id === id);

export function resolveImage(images, id) {
  const image = images[id];
  if (!image) return null;
  if (!image.from) return image.src ? image : null;
  const base = images[image.from];
  return base?.src ? { ...base, ...image } : null;
}

export const recordImages = (record, images) =>
  (record.images ?? []).map(id => resolveImage(images, id)).filter(Boolean);
