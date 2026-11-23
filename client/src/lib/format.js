import { categoryInfo } from './data.js';

const centimetres = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });
const pluralRules = new Intl.PluralRules('uk-UA');
const collator = new Intl.Collator('uk-UA', { sensitivity: 'base', numeric: true });

export const itemForms = {
  product: { one: 'виріб', few: 'вироби', other: 'виробів' },
  work: { one: 'робота', few: 'роботи', other: 'робіт' },
  match: { one: 'збіг', few: 'збіги', other: 'збігів' },
  model: { one: 'модель', few: 'моделі', other: 'моделей' },
  piece: { one: 'товар', few: 'товари', other: 'товарів' },
};

export function pluralCount(number, forms) {
  return number + ' ' + (forms[pluralRules.select(number)] ?? forms.other);
}

export const compareNames = (a, b) => collator.compare(a, b);

export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFC').toLocaleLowerCase('uk')
    .replace(/['’ʼ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function sizeCM(record) {
  return Number.isFinite(record.sizeInches) ? Math.round(record.sizeInches * 25.4) / 10 : null;
}

export function sizeText(record) {
  const size = sizeCM(record);
  return size === null ? '' : centimetres.format(size) + ' см';
}

export function formatPrice(price) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency', currency: price.currency, currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2, minimumFractionDigits: 0,
  }).format(price.amount);
}

export function formatMoney(amount, currency = 'UAH') {
  return formatPrice({ amount, currency });
}

// Оцінка збігу запиту із записом: -1 — не підходить, більше — краще
export function relevance(record, query, taxonomy) {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return 0;

  const category = categoryInfo(taxonomy, record.category);
  const title = normalizeSearch(record.title);
  const primary = normalizeSearch([record.title, record.id, record.slug].join(' '));
  const searchable = normalizeSearch([
    primary, record.description, category?.title, category?.singular, ...(category?.searchTerms ?? []),
    taxonomy.materials?.[record.material], taxonomy.forms?.[record.form], sizeText(record),
  ].filter(Boolean).join(' '));

  if (!tokens.every(token => searchable.includes(token))) return -1;
  return tokens.reduce((score, token) => score + (title.includes(token) ? 3 : primary.includes(token) ? 2 : 1), 0);
}
