const RECIPIENT = 'mlhouse.shop@gmail.com';
export const inquirySubjects = { product: 'Питання про виріб', custom: 'Індивідуальне замовлення', other: 'Інше питання' };

// Перевірка полів форми; повертає тексти помилок (порожній рядок — поле коректне)
export function validateInquiry({ name, email, message }) {
  return {
    name: name.trim() ? '' : 'Вкажіть ім’я.',
    email: !email.trim() ? 'Вкажіть електронну пошту.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Перевірте формат електронної адреси.',
    message: message.trim().length >= 10 ? '' : 'Опишіть запит щонайменше 10 символами.',
  };
}

export function buildMailto({ type, name, email, phone, message, title }) {
  const details = [
    title ? 'Виріб або робота: ' + title : '',
    'Ім’я: ' + name.trim(),
    'Електронна пошта: ' + email.trim(),
    phone.trim() ? 'Телефон: ' + phone.trim() : '',
  ].filter(Boolean);
  const body = details.join('\r\n') + '\r\n\r\n' + message.trim().replace(/\r?\n/g, '\r\n');
  return `mailto:${RECIPIENT}?subject=${encodeURIComponent(inquirySubjects[type])}&body=${encodeURIComponent(body)}`;
}
