import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/Cart.jsx';
import { useSiteData } from '../context/SiteData.jsx';
import { formatMoney } from '../lib/format.js';
import { deliveryLabels, paymentLabels, submitOrder, validateCheckout } from '../lib/orders.js';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon } from '../components/Icon.jsx';
import { Breadcrumbs, EmptyState, LoadError } from '../components/Ui.jsx';

const initial = { customerName: '', phone: '', email: '', comment: '', deliveryMethod: 'nova_poshta', city: '', warehouse: '', paymentMethod: 'cod' };

export default function Checkout() {
  usePageTitle('Оформлення замовлення');
  const { items, clear } = useCart();
  const { status, data } = useSiteData();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');

  const lines = status === 'ready'
    ? items.map(item => ({ ...item, record: data.products.find(p => p.slug === item.slug) })).filter(l => l.record?.price) : [];
  const total = lines.reduce((sum, l) => sum + l.record.price.amount * l.qty, 0);
  const shipping = values.deliveryMethod === 'nova_poshta';

  const change = event => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (errors[name] || name === 'deliveryMethod') setErrors(validateCheckout(next));
  };

  const submit = async event => {
    event.preventDefault();
    setFailure('');
    const found = validateCheckout(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById('checkout-' + first)?.focus(); return; }
    setSending(true);
    try {
      const result = await submitOrder({ ...values, items: lines.map(({ slug, qty }) => ({ slug, qty })) });
      if (result.errors) { setErrors(result.errors); if (result.errors.items) setFailure(result.errors.items); return; }
      clear();
      navigate('/order/' + encodeURIComponent(result.order.number));
    } catch (error) {
      console.error(error);
      setFailure('Не вдалося надіслати замовлення. Спробуйте ще раз.');
    } finally {
      setSending(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="form-field">
      <label htmlFor={'checkout-' + name}>{label}</label>
      {props.as === 'textarea'
        ? <textarea id={'checkout-' + name} name={name} rows={3} maxLength={1000} value={values[name]} onChange={change} />
        : <input id={'checkout-' + name} name={name} value={values[name]} onChange={change} type={props.type} maxLength={props.maxLength ?? 100}
            autoComplete={props.autoComplete} inputMode={props.inputMode} placeholder={props.placeholder}
            aria-invalid={errors[name] ? 'true' : undefined} aria-describedby={errors[name] ? name + '-error' : undefined} />}
      {errors[name] && <p className="field-error" id={name + '-error'}>{errors[name]}</p>}
    </div>
  );

  let body;
  if (status === 'error') body = <LoadError />;
  else if (status === 'loading') body = <p className="meta" role="status">Завантаження…</p>;
  else if (!lines.length) {
    body = (
      <EmptyState title="Кошик порожній" message="Додайте вироби з каталогу, щоб оформити замовлення.">
        <Link className="button button--primary" to="/catalog">До каталогу <Icon name="arrow" /></Link>
      </EmptyState>
    );
  } else {
    body = (
      <form className="cart-layout checkout-form" noValidate onSubmit={submit}>
        <div className="checkout-fields">
          <fieldset className="checkout-group">
            <legend>Контактні дані</legend>
            <div className="form-columns">
              {field('customerName', 'Ім’я *', { autoComplete: 'name' })}
              {field('phone', 'Телефон *', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '0671234567', maxLength: 40 })}
            </div>
            {field('email', 'Електронна пошта', { type: 'email', autoComplete: 'email', maxLength: 254 })}
          </fieldset>

          <fieldset className="checkout-group">
            <legend>Доставка</legend>
            <div className="choice-list">
              {Object.entries(deliveryLabels).map(([value, label]) => (
                <label key={value} className="choice">
                  <input type="radio" name="deliveryMethod" value={value} checked={values.deliveryMethod === value} onChange={change} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {shipping && (
              <div className="form-columns">
                {field('city', 'Місто *', { autoComplete: 'address-level2' })}
                {field('warehouse', 'Відділення або поштомат *', { maxLength: 200, placeholder: 'Наприклад, Відділення №12' })}
              </div>
            )}
            {!shipping && <p className="meta">Адресу самовивозу уточнимо після оформлення.</p>}
          </fieldset>

          <fieldset className="checkout-group">
            <legend>Оплата</legend>
            <div className="choice-list">
              <label className="choice">
                <input type="radio" name="paymentMethod" value="cod" checked={values.paymentMethod === 'cod'} onChange={change} />
                <span>{paymentLabels.cod}</span>
              </label>
              <label className="choice choice--disabled">
                <input type="radio" name="paymentMethod" value="card" disabled />
                <span>{paymentLabels.card} <small className="meta">(скоро)</small></span>
              </label>
            </div>
          </fieldset>

          {field('comment', 'Коментар до замовлення', { as: 'textarea' })}
        </div>

        <aside className="cart-summary" aria-label="Ваше замовлення">
          <h2 className="cart-item__title">Ваше замовлення</h2>
          <ul className="checkout-lines">
            {lines.map(({ record, qty }) => (
              <li key={record.slug}><span>{record.title} × {qty}</span><strong>{formatMoney(record.price.amount * qty)}</strong></li>
            ))}
          </ul>
          <p className="cart-summary__total"><span>Разом</span><span data-testid="checkout-total">{formatMoney(total)}</span></p>
          {failure && <p className="field-error" role="alert">{failure}</p>}
          <button type="submit" className="button button--primary" disabled={sending}>{sending ? 'Надсилаємо…' : 'Підтвердити замовлення'}</button>
          <Link className="text-link" to="/cart">Повернутися в кошик</Link>
        </aside>
      </form>
    );
  }

  return (
    <main id="main" className="container cart-page" tabIndex={-1}>
      <Breadcrumbs trail={[['Кошик', '/cart'], ['Оформлення']]} />
      <div className="page-intro"><h1>Оформлення замовлення</h1></div>
      {body}
    </main>
  );
}
