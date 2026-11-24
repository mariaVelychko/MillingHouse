// Чиста логіка адмінки: статуси замовлень, slug і перевірка полів товару.
const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'done', 'cancelled'];

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ъ: '',
};

function slugify(title) {
  const slug = String(title ?? '').toLowerCase().replace(/['’ʼ]/g, '')
    .replace(/[а-яґєіїыэъь]/g, ch => CYR[ch] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return slug;
}

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const optNumber = value => (value === '' || value === null || value === undefined ? null : Number(value));

function validateProductInput(body = {}) {
  const errors = {};
  const title = text(body.title, 200);
  if (title.length < 2) errors.title = 'Вкажіть назву.';

  const slug = text(body.slug, 100).toLowerCase() || slugify(title);
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.slug = 'Адреса: латиниця, цифри та дефіси.';

  const categorySlug = text(body.categorySlug, 60);
  if (!categorySlug) errors.categorySlug = 'Оберіть категорію.';

  const priceUah = optNumber(body.priceUah);
  if (priceUah !== null && (!Number.isInteger(priceUah) || priceUah < 0)) errors.priceUah = 'Ціна — ціле число від 0.';
  const oldPriceUah = optNumber(body.oldPriceUah);
  if (oldPriceUah !== null && (!Number.isInteger(oldPriceUah) || oldPriceUah < 0)) errors.oldPriceUah = 'Стара ціна — ціле число від 0.';

  const dims = {};
  for (const key of ['heightCm', 'widthCm']) {
    const value = optNumber(body[key]);
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 1000)) errors[key] = 'Розмір у см, більше 0.';
    dims[key] = value;
  }

  const rawUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
  const imageUrls = rawUrls.map(url => text(url, 1000)).filter(Boolean);
  if (imageUrls.length > 10 || imageUrls.some(url => !/^https?:\/\/\S+$/i.test(url))) errors.imageUrls = 'До 10 посилань, що починаються з http:// або https://.';

  const colors = (Array.isArray(body.colors) ? body.colors : []).map(color => text(color, 40)).filter(Boolean).slice(0, 12);

  return {
    errors,
    value: {
      title, slug, sku: text(body.sku, 60) || null, categorySlug,
      description: text(body.description, 5000) || null, material: text(body.material, 40) || null,
      priceUah, oldPriceUah, ...dims, inStock: body.inStock !== false, colors, imageUrls,
    },
  };
}

const validateStatus = status => ORDER_STATUSES.includes(status);

module.exports = { ORDER_STATUSES, slugify, validateProductInput, validateStatus };
