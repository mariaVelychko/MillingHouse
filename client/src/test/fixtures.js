export const data = {
  media: {
    'img-1': { src: '/a.jpg', width: 800, height: 800, alt: 'Лампа Зірка', card: { src: '/a.jpg', width: 1000, height: 800 } },
    'img-2': { src: '/b.jpg', width: 800, height: 800, alt: 'Лампа Місяць', card: { src: '/b.jpg', width: 1000, height: 800 } },
  },
  site: { selectedProductSlugs: ['zirka', 'misyats', 'sonce'], featuredWorkSlugs: [], heroImage: 'img-1', productionImage: 'img-1', productionInset: 'img-2', aboutImageIds: ['img-1'] },
  works: [],
  taxonomy: {
    categories: [{ id: 'lampy', title: 'Лампи', singular: 'Лампа', icon: 'star', searchTerms: ['світильник'], image: 'img-1' }],
    materials: { wood: 'Дерево', plastic: 'Пластик' }, forms: {},
    sizes: [{ id: 'under-20', label: 'до 20 см', max: 19.9 }, { id: '20-to-29', label: '20–29 см', min: 20, max: 29.9 }],
  },
  products: [
    { id: '1', slug: 'zirka', title: 'Лампа Зірка', category: 'lampy', material: 'wood', sizeInches: 25 / 2.54, description: 'Нічник', images: ['img-1'], price: { amount: 800, currency: 'UAH' }, inStock: true, colors: [], specs: [] },
    { id: '2', slug: 'misyats', title: 'Лампа Місяць', category: 'lampy', material: 'plastic', sizeInches: 15 / 2.54, description: 'Нічник', images: ['img-2'], price: { amount: 450, currency: 'UAH' }, inStock: true, colors: ['білий'], specs: [['Живлення', 'USB']] },
    { id: '3', slug: 'sonce', title: 'Лампа Сонце', category: 'lampy', material: 'wood', sizeInches: 35 / 2.54, description: 'Нічник', images: [], price: { amount: 1200, currency: 'UAH' }, inStock: true, colors: [], specs: [] },
  ],
};
