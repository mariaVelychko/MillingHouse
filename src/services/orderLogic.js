// Чиста логіка замовлень (без БД): перевірка форми та підрахунок суми на сервері.
const DELIVERY = ['nova_poshta', 'pickup'];
const PAYMENT = ['cod', 'card'];
const MAX_QTY = 99;

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Номер телефону: лишаємо цифри й «+», приймаємо 10–13 цифр (0671234567, +380671234567)
function normalizePhone(value) {
  const digits = text(value, 40).replace(/[^\d]/g, '');
  if (digits.length < 10 || digits.length > 13) return '';
  if (digits.length === 10) return '+38' + digits;
  if (digits.length === 12 && digits.startsWith('380')) return '+' + digits;
  return '+' + digits;
}

// Повертає { errors, value }. errors — об'єкт поле → повідомлення.
function validateOrderInput(body = {}) {
  const errors = {};
  const customerName = text(body.customerName, 100);
  const phone = normalizePhone(body.phone);
  const email = text(body.email, 254);
  const deliveryMethod = text(body.deliveryMethod, 20);
  const paymentMethod = text(body.paymentMethod, 20);
  const city = text(body.city, 100);
  const warehouse = text(body.warehouse, 200);

  if (customerName.length < 2) errors.customerName = 'Вкажіть ім’я.';
  if (!phone) errors.phone = 'Вкажіть телефон у форматі 0671234567.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Перевірте формат електронної адреси.';
  if (!DELIVERY.includes(deliveryMethod)) errors.deliveryMethod = 'Оберіть спосіб доставки.';
  if (!PAYMENT.includes(paymentMethod)) errors.paymentMethod = 'Оберіть спосіб оплати.';
  if (deliveryMethod === 'nova_poshta') {
    if (!city) errors.city = 'Вкажіть місто.';
    if (!warehouse) errors.warehouse = 'Вкажіть відділення або поштомат.';
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const merged = new Map();
  for (const item of rawItems) {
    const slug = text(item?.slug, 200);
    const qty = Number(item?.qty);
    if (!slug || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) { errors.items = 'Некоректний склад кошика.'; continue; }
    merged.set(slug, Math.min((merged.get(slug) ?? 0) + qty, MAX_QTY));
  }
  if (!merged.size && !errors.items) errors.items = 'Кошик порожній.';

  return {
    errors,
    value: {
      customerName, phone, email: email || null, comment: text(body.comment, 1000) || null,
      deliveryMethod, paymentMethod,
      city: deliveryMethod === 'nova_poshta' ? city : null,
      warehouse: deliveryMethod === 'nova_poshta' ? warehouse : null,
      items: [...merged].map(([slug, qty]) => ({ slug, qty })),
    },
  };
}

// Складає позиції й суму із цін у БД (ціни з браузера ігноруємо).
// Повертає { error } або { lines, total }.
function priceOrder(items, products) {
  const bySlug = new Map(products.map(product => [product.slug, product]));
  const lines = [];
  for (const { slug, qty } of items) {
    const product = bySlug.get(slug);
    if (!product) return { error: 'Товар недоступний: ' + slug };
    if (!product.priceUah || product.inStock === false) return { error: 'Товару немає в наявності: ' + product.title };
    lines.push({ productId: product.id, slug, title: product.title, unitPriceUah: product.priceUah, quantity: qty });
  }
  return { lines, total: lines.reduce((sum, line) => sum + line.unitPriceUah * line.quantity, 0) };
}

// Номер для клієнта: MH-ГГММДД-0001 (за ідентифікатором)
function orderNumber(id, date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const stamp = String(date.getFullYear()).slice(2) + pad(date.getMonth() + 1) + pad(date.getDate());
  return `MH-${stamp}-${String(id).padStart(4, '0')}`;
}

module.exports = { validateOrderInput, priceOrder, orderNumber, normalizePhone };
