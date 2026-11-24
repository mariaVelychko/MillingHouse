import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../lib/adminApi.js';
import { formatMoney } from '../../lib/format.js';

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/products').then(({ ok, data }) => (ok ? setProducts(data) : setError('Не вдалося завантажити товари.')), () => setError('Сервер недоступний.'));
  }, []);

  const remove = async product => {
    if (!window.confirm(`Видалити «${product.title}»?`)) return;
    const { ok } = await adminFetch('/products/' + product.id, { method: 'DELETE' });
    if (ok) setProducts(list => list.filter(p => p.id !== product.id)); else setError('Не вдалося видалити товар.');
  };

  if (error) return <p className="field-error" role="alert">{error}</p>;
  if (!products) return <p className="meta" role="status">Завантаження…</p>;
  return (
    <>
      <div className="admin-head">
        <h1>Товари <small className="meta">({products.length})</small></h1>
        <Link className="button button--primary" to="/admin/products/new">Додати товар</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Назва</th><th>Категорія</th><th>Ціна</th><th>Наявність</th><th /></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td><td>{p.categorySlug}</td>
                <td>{p.priceUah ? formatMoney(p.priceUah) : '—'}</td>
                <td>{p.inStock ? 'Є' : 'Немає'}</td>
                <td className="admin-actions">
                  <Link className="text-link" to={'/admin/products/' + p.id}>Редагувати</Link>
                  <button type="button" className="text-link" onClick={() => remove(p)}>Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
