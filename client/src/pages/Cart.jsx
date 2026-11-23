import { Link } from 'react-router-dom';
import { useCart } from '../context/Cart.jsx';
import { useSiteData } from '../context/SiteData.jsx';
import { recordImages } from '../lib/data.js';
import { formatMoney, pluralCount, itemForms } from '../lib/format.js';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon } from '../components/Icon.jsx';
import Media from '../components/Media.jsx';
import { Breadcrumbs, EmptyState, LoadError } from '../components/Ui.jsx';
import { productPath } from '../components/Cards.jsx';

export default function Cart() {
  usePageTitle('Кошик');
  const { items, setQty, remove, clear } = useCart();
  const { status, data } = useSiteData();

  let body;
  if (status === 'error') body = <LoadError />;
  else if (status === 'loading') body = <p className="meta" role="status">Завантаження…</p>;
  else {
    // Товари, яких уже немає в каталозі, ігноруємо
    const lines = items.map(item => ({ ...item, record: data.products.find(p => p.slug === item.slug) })).filter(line => line.record?.price);
    const total = lines.reduce((sum, line) => sum + line.record.price.amount * line.qty, 0);
    const units = lines.reduce((sum, line) => sum + line.qty, 0);
    body = !lines.length
      ? <EmptyState title="Кошик порожній" message="Додайте вироби з каталогу, щоб оформити замовлення.">
          <Link className="button button--primary" to="/catalog">До каталогу <Icon name="arrow" /></Link>
        </EmptyState>
      : (
        <div className="cart-layout">
          <ul className="cart-list" aria-label="Товари в кошику">
            {lines.map(({ record, qty }) => {
              const image = recordImages(record, data.media)[0];
              return (
                <li className="cart-item" key={record.slug}>
                  <Link className="cart-item__image" to={productPath(record.slug)} aria-hidden="true" tabIndex={-1}><Media image={image} sizes="88px" /></Link>
                  <div className="cart-item__body">
                    <h2 className="cart-item__title"><Link to={productPath(record.slug)}>{record.title}</Link></h2>
                    <div className="cart-item__row">
                      <div className="qty" role="group" aria-label={'Кількість: ' + record.title}>
                        <button type="button" aria-label="Зменшити кількість" onClick={() => setQty(record.slug, qty - 1)}>−</button>
                        <output aria-live="polite">{qty}</output>
                        <button type="button" aria-label="Збільшити кількість" onClick={() => setQty(record.slug, qty + 1)}>+</button>
                      </div>
                      <strong>{formatMoney(record.price.amount * qty)}</strong>
                      <button type="button" className="text-link" onClick={() => remove(record.slug)}>Видалити</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="cart-summary" aria-label="Підсумок замовлення">
            <p className="meta">{pluralCount(units, itemForms.piece)}</p>
            <p className="cart-summary__total"><span>Разом</span><span data-testid="cart-total">{formatMoney(total)}</span></p>
            <p className="meta">Доставку та оплату оберете на наступному кроці.</p>
            <Link className="button button--primary" to="/checkout">Оформити замовлення</Link>
            <button type="button" className="text-link" onClick={clear}>Очистити кошик</button>
          </aside>
        </div>
      );
  }

  return (
    <main id="main" className="container cart-page" tabIndex={-1}>
      <Breadcrumbs trail={[['Кошик']]} />
      <div className="page-intro"><h1>Кошик</h1></div>
      {body}
    </main>
  );
}
