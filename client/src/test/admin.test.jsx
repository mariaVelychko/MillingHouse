import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './render.jsx';
import { formToProduct, productToForm } from '../lib/adminApi.js';

const res = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body ?? null) });

// Невеликий роутер для підміни fetch: [метод, початок шляху] -> відповідь
function mockApi(routes) {
  const fn = vi.fn((url, options = {}) => {
    const method = options.method ?? 'GET';
    const hit = routes.find(([m, path]) => m === method && url.startsWith(path));
    return hit ? hit[2](options) : res(404, { error: 'x' });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const order = { id: 1, number: 'MH-261124-0001', status: 'new', customerName: 'Марія', phone: '+380671234567', email: null, comment: 'Подарунок',
  deliveryMethod: 'nova_poshta', city: 'Київ', warehouse: 'Відділення 1', paymentMethod: 'cod', totalUah: 1600, createdAt: '2026-11-24T10:00:00Z',
  items: [{ id: 1, title: 'Лампа Зірка', quantity: 2, unitPriceUah: 800 }] };

describe('форма товару: перетворення', () => {
  it('туди й назад', () => {
    const form = productToForm({ title: 'Лампа', colors: ['білий', 'чорний'], imageUrls: ['https://a/1.jpg', 'https://a/2.jpg'], inStock: true });
    expect(form.colors).toBe('білий, чорний');
    const body = formToProduct(form);
    expect(body.colors).toEqual(['білий', 'чорний']);
    expect(body.imageUrls).toEqual(['https://a/1.jpg', 'https://a/2.jpg']);
  });
});

describe('адмінка', () => {
  it('без входу показує форму входу, помилка при невірному паролі, потім вхід', async () => {
    const user = userEvent.setup();
    let loggedIn = false;
    mockApi([
      ['GET', '/api/admin/me', () => res(200, { admin: loggedIn, configured: true })],
      ['POST', '/api/admin/login', ({ body }) => (JSON.parse(body).password === 'ok' ? (loggedIn = true, res(200, { ok: true })) : res(401, { error: 'Невірний логін або пароль' }))],
      ['GET', '/api/admin/orders', () => res(200, [])],
    ]);
    renderApp('/admin/orders');
    await user.type(await screen.findByLabelText('Логін'), 'admin');
    await user.type(screen.getByLabelText('Пароль'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Увійти' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Невірний логін або пароль');
    await user.clear(screen.getByLabelText('Пароль'));
    await user.type(screen.getByLabelText('Пароль'), 'ok');
    await user.click(screen.getByRole('button', { name: 'Увійти' }));
    expect(await screen.findByRole('heading', { name: /Замовлення/ })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('список замовлень: деталі та зміна статусу', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi([
      ['GET', '/api/admin/me', () => res(200, { admin: true, configured: true })],
      ['GET', '/api/admin/orders', () => res(200, [order])],
      ['PATCH', '/api/admin/orders/MH-261124-0001', ({ body }) => res(200, { ...order, status: JSON.parse(body).status })],
    ]);
    renderApp('/admin/orders');
    expect(await screen.findByText('MH-261124-0001')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Деталі' }));
    expect(screen.getByText(/Подарунок/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Статус MH-261124-0001'), 'shipped');
    await waitFor(() => expect(screen.getByLabelText('Статус MH-261124-0001')).toHaveValue('shipped'));
    const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
    expect(JSON.parse(patch[1].body)).toEqual({ status: 'shipped' });
    vi.unstubAllGlobals();
  });

  it('додавання товару: відправляє дані й повертає до списку', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi([
      ['GET', '/api/admin/me', () => res(200, { admin: true, configured: true })],
      ['GET', '/api/admin/categories', () => res(200, [{ slug: 'lampy', title: 'Лампи' }])],
      ['POST', '/api/admin/products', () => res(201, { id: 5 })],
      ['GET', '/api/admin/products', () => res(200, [])],
    ]);
    renderApp('/admin/products/new');
    await user.type(await screen.findByLabelText('Назва *'), 'Лампа Місяць');
    await user.selectOptions(screen.getByLabelText('Категорія *'), 'lampy');
    await user.type(screen.getByLabelText('Ціна, грн'), '450');
    await user.type(screen.getByLabelText(/Посилання на фото/), 'https://a.ua/1.jpg');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(await screen.findByRole('heading', { name: /Товари/ })).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(JSON.parse(post[1].body)).toMatchObject({ title: 'Лампа Місяць', categorySlug: 'lampy', priceUah: '450', imageUrls: ['https://a.ua/1.jpg'] });
    vi.unstubAllGlobals();
  });

  it('показує помилки валідації від сервера біля полів', async () => {
    const user = userEvent.setup();
    mockApi([
      ['GET', '/api/admin/me', () => res(200, { admin: true, configured: true })],
      ['GET', '/api/admin/categories', () => res(200, [])],
      ['POST', '/api/admin/products', () => res(400, { errors: { title: 'Вкажіть назву.', slug: 'Таке значення вже існує.' } })],
    ]);
    renderApp('/admin/products/new');
    await user.click(await screen.findByRole('button', { name: 'Зберегти' }));
    expect(await screen.findByText('Вкажіть назву.')).toBeInTheDocument();
    expect(screen.getByText('Таке значення вже існує.')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('видалення товару питає підтвердження', async () => {
    const user = userEvent.setup();
    const product = { id: 3, title: 'Лампа Сонце', categorySlug: 'lampy', priceUah: 1200, inStock: true };
    const fetchMock = mockApi([
      ['GET', '/api/admin/me', () => res(200, { admin: true, configured: true })],
      ['GET', '/api/admin/products', () => res(200, [product])],
      ['DELETE', '/api/admin/products/3', () => res(204)],
    ]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderApp('/admin/products');
    const button = await screen.findByRole('button', { name: 'Видалити' });
    await user.click(button);
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(false);
    await user.click(button);
    await waitFor(() => expect(screen.queryByText('Лампа Сонце')).not.toBeInTheDocument());
    confirm.mockRestore(); vi.unstubAllGlobals();
  });
});
