// Запити до API замовлень. Помилки валідації повертаємо як { errors }.
export async function submitOrder(payload) {
  const response = await fetch('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 400 && body.errors) return { errors: body.errors };
  if (!response.ok) throw new Error('API ' + response.status);
  return { order: body };
}

export async function fetchOrder(number) {
  const response = await fetch('/api/orders/' + encodeURIComponent(number));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('API ' + response.status);
  return response.json();
}

export const deliveryLabels = { nova_poshta: 'Нова Пошта', pickup: 'Самовивіз' };
export const paymentLabels = { cod: 'Оплата при отриманні', card: 'Оплата карткою' };

// Перевірка полів у браузері (сервер перевіряє те саме ще раз)
export function validateCheckout(v) {
  const errors = {};
  if (v.customerName.trim().length < 2) errors.customerName = 'Вкажіть ім’я.';
  const digits = v.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) errors.phone = 'Вкажіть телефон у форматі 0671234567.';
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Перевірте формат електронної адреси.';
  if (v.deliveryMethod === 'nova_poshta') {
    if (!v.city.trim()) errors.city = 'Вкажіть місто.';
    if (!v.warehouse.trim()) errors.warehouse = 'Вкажіть відділення або поштомат.';
  }
  return errors;
}
