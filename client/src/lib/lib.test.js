import { describe, expect, it } from 'vitest';
import { archiveOptions, matchingRecords, readState, toSearchParams } from './archive.js';
import { formatPrice, pluralCount, itemForms, relevance, sizeText } from './format.js';
import { buildMailto, validateInquiry } from './inquiry.js';
import { cartReducer } from '../context/Cart.jsx';
import { data } from '../test/fixtures.js';

const { products, taxonomy } = data;

describe('format', () => {
  it('відмінює слова за числом', () => {
    expect(pluralCount(1, itemForms.product)).toBe('1 виріб');
    expect(pluralCount(3, itemForms.product)).toBe('3 вироби');
    expect(pluralCount(11, itemForms.product)).toBe('11 виробів');
  });
  it('показує розмір у сантиметрах і ціну в гривнях', () => {
    expect(sizeText(products[0])).toBe('25 см');
    expect(formatPrice({ amount: 800, currency: 'UAH' })).toMatch(/800/);
  });
  it('релевантність: збіг у назві важливіший, невідоме слово відкидає запис', () => {
    expect(relevance(products[0], 'зірка', taxonomy)).toBeGreaterThan(0);
    expect(relevance(products[0], 'світильник', taxonomy)).toBeGreaterThan(0); // searchTerms категорії
    expect(relevance(products[0], 'абракадабра', taxonomy)).toBe(-1);
  });
});

describe('archive', () => {
  const options = archiveOptions(products, taxonomy, 'product');
  it('будує фільтри з лічильниками', () => {
    const material = options.facets.find(f => f.key === 'material');
    expect(material.options.find(o => o.id === 'wood').count).toBe(2);
    expect(options.hasPrice).toBe(true);
  });
  it('фільтрує за матеріалом і ціною', () => {
    const state = readState(new URLSearchParams('material=wood&maxPrice=1000'), options);
    expect(matchingRecords(products, state, taxonomy).map(p => p.slug)).toEqual(['zirka']);
  });
  it('фільтрує за розміром', () => {
    const state = readState(new URLSearchParams('size=under-20'), options);
    expect(matchingRecords(products, state, taxonomy).map(p => p.slug)).toEqual(['misyats']);
  });
  it('сортує за ціною', () => {
    const state = readState(new URLSearchParams('sort=price-desc'), options);
    expect(matchingRecords(products, state, taxonomy).map(p => p.slug)).toEqual(['sonce', 'zirka', 'misyats']);
  });
  it('ігнорує некоректні параметри та повертає стан в URL', () => {
    const state = readState(new URLSearchParams('minPrice=900&maxPrice=100&sort=abc&page=-3&material=glass'), options);
    expect(state).toMatchObject({ minPrice: null, maxPrice: null, sort: 'default', page: 1 });
    expect(state.filters.material).toEqual([]);
    const params = toSearchParams({ ...state, q: 'лампа', page: 2, filters: { ...state.filters, material: ['wood'] } });
    expect(params.toString()).toBe('q=%D0%BB%D0%B0%D0%BC%D0%BF%D0%B0&material=wood&page=2');
  });
});

describe('cart reducer', () => {
  it('додає, збільшує, змінює кількість і видаляє', () => {
    let items = cartReducer([], { type: 'add', slug: 'a' });
    items = cartReducer(items, { type: 'add', slug: 'a' });
    expect(items).toEqual([{ slug: 'a', qty: 2 }]);
    items = cartReducer(items, { type: 'setQty', slug: 'a', qty: 5 });
    expect(items[0].qty).toBe(5);
    expect(cartReducer(items, { type: 'setQty', slug: 'a', qty: 0 })).toEqual([]);
    expect(cartReducer(items, { type: 'clear' })).toEqual([]);
  });
  it('обмежує кількість 99', () => {
    expect(cartReducer([{ slug: 'a', qty: 98 }], { type: 'add', slug: 'a', qty: 10 })[0].qty).toBe(99);
  });
});

describe('inquiry', () => {
  it('валідує поля', () => {
    expect(validateInquiry({ name: '', email: 'x', message: 'коротко' })).toEqual({
      name: 'Вкажіть ім’я.', email: 'Перевірте формат електронної адреси.', message: 'Опишіть запит щонайменше 10 символами.',
    });
    expect(Object.values(validateInquiry({ name: 'Марія', email: 'm@a.ua', message: 'Хочу лампу на замовлення' })).every(v => !v)).toBe(true);
  });
  it('формує mailto', () => {
    const url = buildMailto({ type: 'product', name: 'Марія', email: 'm@a.ua', phone: '', message: 'Привіт, потрібна лампа', title: 'Лампа Зірка' });
    expect(url).toMatch(/^mailto:mlhouse\.shop@gmail\.com\?subject=/);
    expect(decodeURIComponent(url)).toContain('Виріб або робота: Лампа Зірка');
  });
});
