import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMoney } from '../lib/format.js';
import { deliveryLabels, fetchOrder, paymentLabels } from '../lib/orders.js';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon } from '../components/Icon.jsx';
import { EmptyState, LoadError } from '../components/Ui.jsx';

export default function OrderDone() {
  const { number } = useParams();
  usePageTitle('Замовлення ' + number);
  const [state, setState] = useState({ status: 'loading', order: null });

  useEffect(() => {
    let cancelled = false;
    fetchOrder(number).then(
      order => { if (!cancelled) setState({ status: order ? 'ready' : 'missing', order }); },
      error => { console.error(error); if (!cancelled) setState({ status: 'error', order: null }); },
    );
    return () => { cancelled = true; };
  }, [number]);

  const { status, order } = state;
  return (
    <main id="main" className="container cart-page" tabIndex={-1}>
      {status === 'loading' && <p className="meta" role="status">Завантаження…</p>}
      {status === 'error' && <LoadError />}
      {status === 'missing' && (
        <EmptyState heading="h1" title="Замовлення не знайдено" message="Перевірте номер замовлення.">
          <Link className="button button--primary" to="/catalog">До каталогу <Icon name="arrow" /></Link>
        </EmptyState>
      )}
      {status === 'ready' && (
        <>
          <div className="page-intro">
            <h1>Дякуємо за замовлення!</h1>
            <p className="lead">Номер вашого замовлення: <strong>{order.number}</strong>. Ми зв’яжемося з вами для підтвердження.</p>
          </div>
          <section className="cart-summary" aria-label="Деталі замовлення">
            <ul className="checkout-lines">
              {order.items.map(item => (
                <li key={item.slug}><span>{item.title} × {item.quantity}</span><strong>{formatMoney(item.unitPriceUah * item.quantity)}</strong></li>
              ))}
            </ul>
            <p className="cart-summary__total"><span>Разом</span><span>{formatMoney(order.totalUah)}</span></p>
            <p className="meta">
              {deliveryLabels[order.deliveryMethod]}{order.city ? `: ${order.city}, ${order.warehouse}` : ''} · {paymentLabels[order.paymentMethod]}
            </p>
            <Link className="button button--primary" to="/catalog">Продовжити покупки <Icon name="arrow" /></Link>
          </section>
        </>
      )}
    </main>
  );
}
