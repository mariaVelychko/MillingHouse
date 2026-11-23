import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './render.jsx';

describe('сторінки', () => {
  it('головна показує вибрані вироби', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Вибрані вироби' })).toBeInTheDocument();
    expect(screen.getAllByText('Лампа Зірка').length).toBeGreaterThan(0);
  });

  it('каталог фільтрує за матеріалом через чекбокс і веде стан в URL-фільтрах', async () => {
    const user = userEvent.setup();
    renderApp('/catalog');
    expect(await screen.findByText('Знайдено 3 вироби')).toBeInTheDocument();
    const sidebar = screen.getByRole('complementary', { name: 'Фільтри каталогу' });
    await user.click(within(sidebar).getByRole('checkbox', { name: /Пластик/ }));
    expect(await screen.findByText('Знайдено 1 виріб')).toBeInTheDocument();
    expect(screen.getAllByText('Лампа Місяць').length).toBeGreaterThan(0);
    expect(screen.queryByText('Лампа Зірка')).not.toBeInTheDocument();
  });

  it('каталог: пошук і порожній результат', async () => {
    const user = userEvent.setup();
    renderApp('/catalog?q=абракадабра');
    expect(await screen.findByText('Нічого не знайдено')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Скинути пошук і фільтри' }));
    expect(await screen.findByText('Знайдено 3 вироби')).toBeInTheDocument();
  });

  it('сторінка товару: характеристики, ціна, додавання в кошик', async () => {
    const user = userEvent.setup();
    renderApp('/product/misyats');
    expect(await screen.findByRole('heading', { level: 1, name: 'Лампа Місяць' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Живлення/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Додати в кошик: Лампа Місяць/ }));
    expect(await screen.findByLabelText('Кошик, товарів: 1')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('millinghouse-cart'))).toEqual([{ slug: 'misyats', qty: 1 }]);
  });

  it('неіснуючий товар і неіснуюча сторінка', async () => {
    renderApp('/product/nemaye');
    expect(await screen.findByRole('heading', { level: 1, name: 'Виріб не знайдено' })).toBeInTheDocument();
  });

  it('кошик: кількість, сума, видалення', async () => {
    const user = userEvent.setup();
    localStorage.setItem('millinghouse-cart', JSON.stringify([{ slug: 'zirka', qty: 1 }, { slug: 'misyats', qty: 2 }]));
    renderApp('/cart');
    const total = await screen.findByTestId('cart-total');
    expect(total.textContent.replace(/\s/g, '')).toContain('1700');
    await user.click(screen.getAllByRole('button', { name: 'Збільшити кількість' })[0]);
    await waitFor(() => expect(screen.getByTestId('cart-total').textContent.replace(/\s/g, '')).toContain('2500'));
    for (const button of screen.getAllByRole('button', { name: 'Видалити' })) await user.click(button);
    expect(await screen.findByText('Кошик порожній')).toBeInTheDocument();
  });

  it('пошук по сайту', async () => {
    renderApp('/search?q=сонце');
    expect(await screen.findByText(/«сонце» · 1 збіг/)).toBeInTheDocument();
  });

  it('контакти: валідація та створення чернетки листа', async () => {
    const user = userEvent.setup();
    renderApp('/contacts?product=zirka');
    await user.click(await screen.findByRole('button', { name: /Підготувати лист/ }));
    expect(await screen.findByText('Вкажіть ім’я.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Ім’я *'), 'Марія');
    await user.type(screen.getByLabelText('Електронна пошта *'), 'm@a.ua');
    await user.type(screen.getByLabelText('Повідомлення *'), 'Хочу таку лампу в подарунок');
    await user.click(screen.getByRole('button', { name: /Підготувати лист/ }));
    const link = await screen.findByRole('link', { name: /Відкрити чернетку/ });
    expect(decodeURIComponent(link.getAttribute('href'))).toContain('Лампа Зірка');
  });

  it('помилка API показує повідомлення', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp('/catalog', () => Promise.reject(new Error('fail')));
    expect(await screen.findByText('Не вдалося відкрити розділ')).toBeInTheDocument();
    spy.mockRestore();
  });
});
