import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './render.jsx';
import { validateCheckout } from '../lib/orders.js';

const json = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

describe('валідація форми', () => {
  const base = { customerName: 'Марія', phone: '0671234567', email: '', comment: '', deliveryMethod: 'pickup', city: '', warehouse: '', paymentMethod: 'cod' };
  it('самовивіз не вимагає міста', () => expect(validateCheckout(base)).toEqual({}));
  it('Нова Пошта вимагає місто й відділення', () => {
    expect(Object.keys(validateCheckout({ ...base, deliveryMethod: 'nova_poshta' }))).toEqual(['city', 'warehouse']);
  });
  it('перевіряє телефон та e-mail', () => {
    expect(Object.keys(validateCheckout({ ...base, phone: '12', email: 'x' }))).toEqual(['phone', 'email']);
  });
});

describe('оформлення', () => {
  it('порожній кошик не дає оформити', async () => {
    renderApp('/checkout');
    expect(await screen.findByText('Кошик порожній')).toBeInTheDocument();
  });

  it('показує помилки і не надсилає некоректну форму', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('millinghouse-cart', JSON.stringify([{ slug: 'zirka', qty: 1 }]));
    renderApp('/checkout');
    await user.click(await screen.findByRole('button', { name: 'Підтвердити замовлення' }));
    expect(await screen.findByText('Вкажіть ім’я.')).toBeInTheDocument();
    expect(screen.getByText('Вкажіть місто.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('надсилає замовлення, очищає кошик і відкриває підтвердження', async () => {
    const user = userEvent.setup();
    const order = { number: 'MH-261123-0001', totalUah: 1600, deliveryMethod: 'pickup', paymentMethod: 'cod', city: null, warehouse: null,
      items: [{ slug: 'zirka', title: 'Лампа Зірка', unitPriceUah: 800, quantity: 2 }] };
    const fetchMock = vi.fn(url => (url === '/api/orders' ? json(201, order) : json(200, order)));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('millinghouse-cart', JSON.stringify([{ slug: 'zirka', qty: 2 }]));
    renderApp('/checkout');
    await user.type(await screen.findByLabelText('Ім’я *'), 'Марія');
    await user.type(screen.getByLabelText('Телефон *'), '0671234567');
    await user.click(screen.getByRole('radio', { name: 'Самовивіз' }));
    await user.click(screen.getByRole('button', { name: 'Підтвердити замовлення' }));

    expect(await screen.findByRole('heading', { name: 'Дякуємо за замовлення!' })).toBeInTheDocument();
    expect(screen.getByText('MH-261123-0001')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[0];
    const sent = JSON.parse(options.body);
    expect(sent.items).toEqual([{ slug: 'zirka', qty: 2 }]);
    expect(sent.deliveryMethod).toBe('pickup');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('millinghouse-cart'))).toEqual([]));
    vi.unstubAllGlobals();
  });

  it('помилка сервера залишає кошик і показує повідомлення', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(() => json(400, { errors: { items: 'Товару немає в наявності: Лампа Зірка' } })));
    localStorage.setItem('millinghouse-cart', JSON.stringify([{ slug: 'zirka', qty: 1 }]));
    renderApp('/checkout');
    await user.type(await screen.findByLabelText('Ім’я *'), 'Марія');
    await user.type(screen.getByLabelText('Телефон *'), '0671234567');
    await user.click(screen.getByRole('radio', { name: 'Самовивіз' }));
    await user.click(screen.getByRole('button', { name: 'Підтвердити замовлення' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('немає в наявності');
    expect(JSON.parse(localStorage.getItem('millinghouse-cart'))).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
