(async () => {
  'use strict';

  const { loadData } = globalThis.millinghouse['data'];
  const { escapeHTML, route } = globalThis.millinghouse['common'];

  const form = document.querySelector('#inquiry-form');
  const draft = document.querySelector('#inquiry-draft');
  const status = document.querySelector('#form-status');
  const mail = document.querySelector('#inquiry-mail');
  const source = document.querySelector('#inquiry-context');
  const params = new URLSearchParams(location.search);
  const type = form.elements.type;
  const recipient = document.querySelector('.contact-email').getAttribute('href');
  let inquiryTitle = '';
  if (['product', 'custom', 'other'].includes(params.get('type'))) type.value = params.get('type');

  const fields = [
    { input: form.elements.name, error: 'name-error', message: input => input.value.trim() ? '' : 'Вкажіть ім’я.' },
    { input: form.elements.email, error: 'email-error', message: input => {
      if (!input.value.trim()) return 'Вкажіть електронну пошту.';
      return input.validity.typeMismatch ? 'Перевірте формат електронної адреси.' : '';
    } },
    { input: form.elements.message, error: 'message-error', message: input => {
      return input.value.trim().length >= 10 ? '' : 'Опишіть запит щонайменше 10 символами.';
    } },
  ];

  function validate({ input, error, message }) {
    const text = message(input);
    const feedback = document.getElementById(error);
    feedback.textContent = text;
    feedback.hidden = !text;
    if (text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !text;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = fields.filter(field => !validate(field));
    if (invalid.length) {
      invalid[0].input.focus();
      return;
    }

    const subject = type.selectedOptions[0].textContent;
    const phone = form.elements.phone.value.trim();
    const details = [
      inquiryTitle ? 'Виріб або робота: ' + inquiryTitle : '',
      'Ім’я: ' + form.elements.name.value.trim(),
      'Електронна пошта: ' + form.elements.email.value.trim(),
      phone ? 'Телефон: ' + phone : '',
    ].filter(Boolean);
    const body = details.join('\r\n') + '\r\n\r\n' + form.elements.message.value.trim().replace(/\r?\n/g, '\r\n');
    mail.href = recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    draft.hidden = false;
    status.textContent = 'Чернетка готова. Відкрийте її в поштовій програмі, щоб надіслати лист.';
    mail.focus();
  });

  form.addEventListener('input', event => {
    draft.hidden = true;
    mail.removeAttribute('href');
    status.textContent = '';
    const field = fields.find(({ input }) => input === event.target);
    if (field && field.input.hasAttribute('aria-invalid')) validate(field);
  });

  const kind = params.has('product') ? 'product' : params.has('work') ? 'work' : null;
  if (kind) {
    try {
      const [records] = await loadData(kind === 'product' ? 'products' : 'works');
      const record = records.find(item => item.slug === params.get(kind));
      if (record) {
        inquiryTitle = record.title;
        source.innerHTML = '<p class="meta">' + (kind === 'product' ? 'Виріб із каталогу' : 'Робота з портфоліо') + '</p>' +
          '<a href="' + route(kind, { slug: record.slug }) + '">' + escapeHTML(record.title) + '</a>';
        source.hidden = false;
        if (!params.has('type')) type.value = kind === 'product' ? 'product' : 'custom';
      }
    } catch (error) {
      console.error(error);
    }
  }
  form.hidden = false;
})();
