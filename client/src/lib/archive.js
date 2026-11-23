import { compareNames, relevance, sizeCM } from './format.js';

export function withinSize(record, range) {
  const cm = sizeCM(record);
  return cm !== null && cm >= (range.min ?? 0) && cm <= (range.max ?? Infinity);
}

export function archiveOptions(records, taxonomy, kind) {
  const unique = key => new Set(records.map(record => record[key]).filter(Boolean));
  const options = (lookup = {}, key) => {
    const values = unique(key);
    return Object.entries(lookup).filter(([id]) => values.has(id)).map(([id, label]) => ({ id, label }));
  };
  const categories = taxonomy.categories.filter(category => unique('category').has(category.id));
  const facets = [
    { key: 'category', label: 'Категорія', options: categories.map(({ id, title }) => ({ id, label: title })) },
    { key: 'material', label: 'Матеріал', options: options(taxonomy.materials, 'material') },
    { key: 'form', label: 'Форма', options: options(taxonomy.forms, 'form') },
  ];
  const hasPrice = kind === 'product' && records.some(record => record.price?.currency === 'UAH');
  if (kind === 'product') {
    facets.push({
      key: 'size', label: 'Розмір',
      options: taxonomy.sizes.filter(range => records.some(record => withinSize(record, range))),
    });
  }
  for (const facet of facets) {
    facet.options = facet.options.map(option => ({
      ...option,
      count: records.filter(record => facet.key === 'size' ? withinSize(record, option) : record[facet.key] === option.id).length,
    }));
  }
  const sort = [['default', 'За добіркою'], ['title-asc', 'Назва: А–Я'], ['title-desc', 'Назва: Я–А']];
  if (hasPrice) sort.push(['price-asc', 'Ціна: від нижчої'], ['price-desc', 'Ціна: від вищої']);
  return { categories, facets: facets.filter(facet => facet.options.length), hasPrice, sort, kind };
}

export function priceBound(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function readState(params, options) {
  const filters = Object.fromEntries(options.facets.map(({ key, options: items }) => [
    key, items.filter(option => params.getAll(key).includes(option.id)).map(option => option.id),
  ]));
  const minPrice = options.hasPrice ? priceBound(params.get('minPrice')) : null;
  const maxPrice = options.hasPrice ? priceBound(params.get('maxPrice')) : null;
  const validRange = minPrice === null || maxPrice === null || minPrice <= maxPrice;
  const requestedPage = Number(params.get('page'));
  const sort = params.get('sort');
  return {
    q: (params.get('q') ?? '').trim().slice(0, 120),
    filters,
    minPrice: validRange ? minPrice : null,
    maxPrice: validRange ? maxPrice : null,
    sort: options.sort.some(([key]) => key === sort) ? sort : 'default',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    archive: options.kind === 'work' && params.get('archive') === '1',
    view: options.kind === 'product' && params.get('view') === 'list' ? 'list' : 'grid',
  };
}

// Стан -> параметри адреси (порожні значення не потрапляють в URL)
export function toSearchParams(state) {
  const params = new URLSearchParams();
  const add = (key, value) => { if (value !== null && value !== undefined && value !== '') params.append(key, value); };
  add('q', state.q);
  for (const [key, values] of Object.entries(state.filters)) values.forEach(value => add(key, value));
  add('minPrice', state.minPrice);
  add('maxPrice', state.maxPrice);
  add('sort', state.sort === 'default' ? null : state.sort);
  add('page', state.page > 1 ? state.page : null);
  add('archive', state.archive ? 1 : null);
  add('view', state.view === 'list' ? 'list' : null);
  return params;
}

export function hasFilters(state) {
  return Object.values(state.filters).some(values => values.length) || state.minPrice !== null || state.maxPrice !== null;
}

export function matchingRecords(records, state, taxonomy) {
  const active = Object.entries(state.filters).filter(([, values]) => values.length);
  const hasPriceFilter = state.minPrice !== null || state.maxPrice !== null;
  const matches = [];
  for (const record of records) {
    const score = relevance(record, state.q, taxonomy);
    if (score < 0) continue;
    if (!active.every(([key, values]) => key === 'size'
      ? taxonomy.sizes.some(range => values.includes(range.id) && withinSize(record, range))
      : values.includes(record[key]))) continue;
    const price = record.price?.currency === 'UAH' ? record.price.amount : null;
    if (hasPriceFilter && (price === null || price < (state.minPrice ?? 0) || price > (state.maxPrice ?? Infinity))) continue;
    matches.push({ record, score, price });
  }
  matches.sort((a, b) => {
    switch (state.sort) {
      case 'title-asc': return compareNames(a.record.title, b.record.title);
      case 'title-desc': return compareNames(b.record.title, a.record.title);
      case 'price-asc':
      case 'price-desc':
        if (a.price === null) return b.price === null ? 0 : 1;
        if (b.price === null) return -1;
        return state.sort === 'price-asc' ? a.price - b.price : b.price - a.price;
      default: return b.score - a.score;
    }
  });
  return matches.map(({ record }) => record);
}
