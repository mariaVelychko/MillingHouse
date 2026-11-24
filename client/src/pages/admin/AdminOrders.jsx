import { Fragment, useEffect, useState } from 'react';
import { adminFetch, statusLabels } from '../../lib/adminApi.js';
import { formatMoney } from '../../lib/format.js';
import { deliveryLabels, paymentLabels } from '../../lib/orders.js';

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    adminFetch('/orders').then(({ ok, data }) => (ok ? setOrders(data) : setError('Не вдалося завантажити замовлення.')), () => setError('Сервер недоступний.'));
  }, []);

  const setStatus = async (number, status) => {
    const { ok, data } = await adminFetch('/orders/' + encodeURIComponent(number), { method: 'PATCH', body: { status } });
    if (ok) setOrders(list => list.map(o => (o.number === number ? { ...o, status: data.status } : o)));
    else setError('Не вдалося змінити статус.');
  };

  if (error) return <p className="field-error" role="alert">{error}</p>;
  if (!orders) return <p className="meta" role="status">Завантаження…</p>;
  return (
    <>
      <h1>Замовлення <small className="meta">({orders.length})</small></h1>
      {!orders.length && <p className="meta">Замовлень ще немає.</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>№</th><th>Дата</th><th>Клієнт</th><th>Сума</th><th>Статус</th><th /></tr></thead>
          <tbody>
            {orders.map(order => (
              <Fragment key={order.number}>
                <tr>
                  <td>{order.number}</td>
                  <td>{new Date(order.createdAt).toLocaleString('uk-UA')}</td>
                  <td>{order.customerName}<br /><small className="meta">{order.phone}</small></td>
                  <td>{formatMoney(order.totalUah)}</td>
                  <td>
                    <select aria-label={'Статус ' + order.number} value={order.status} onChange={e => setStatus(order.number, e.target.value)}>
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </td>
                  <td><button type="button" className="text-link" aria-expanded={open === order.number}
                    onClick={() => setOpen(open === order.number ? null : order.number)}>Деталі</button></td>
                </tr>
                {open === order.number && (
                  <tr className="admin-details"><td colSpan={6}>
                    <p>{deliveryLabels[order.deliveryMethod]}{order.city ? `: ${order.city}, ${order.warehouse}` : ''} · {paymentLabels[order.paymentMethod]}</p>
                    {order.email && <p>E-mail: {order.email}</p>}
                    {order.comment && <p>Коментар: {order.comment}</p>}
                    <ul>{order.items.map(i => <li key={i.id}>{i.title} × {i.quantity} — {formatMoney(i.unitPriceUah * i.quantity)}</li>)}</ul>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
