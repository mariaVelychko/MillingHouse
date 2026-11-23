import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';
import { buildMailto, inquirySubjects, validateInquiry } from '../lib/inquiry.js';
import { Icon, LineIcon } from '../components/Icon.jsx';
import { Breadcrumbs } from '../components/Ui.jsx';
import { productPath, workPath } from '../components/Cards.jsx';

const blank = { name: '', email: '', phone: '', message: '' };

export default function Contacts() {
  usePageTitle('Контакти');
  const [params] = useSearchParams();
  const { status, data } = useSiteData();
  const initialType = params.get('type');
  const [type, setType] = useState(Object.hasOwn(inquirySubjects, initialType) ? initialType : 'product');
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mailto, setMailto] = useState('');

  const kind = params.has('product') ? 'product' : params.has('work') ? 'work' : null;
  const record = kind && status === 'ready'
    ? (kind === 'product' ? data.products : data.works).find(item => item.slug === params.get(kind))
    : null;
  // Тема за замовчуванням, коли відомо, про що запит
  useEffect(() => { if (record && !params.has('type')) setType(kind === 'product' ? 'product' : 'custom'); }, [record, kind, params]);

  const change = event => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    setMailto('');
    if (touched[name]) setErrors(validateInquiry(next));
  };

  const submit = event => {
    event.preventDefault();
    const found = validateInquiry(values);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    if (Object.values(found).some(Boolean)) {
      document.getElementById('inquiry-' + Object.keys(found).find(key => found[key]))?.focus();
      return;
    }
    setMailto(buildMailto({ ...values, type, title: record?.title }));
  };

  const field = (name, label, props = {}) => (
    <div className="form-field">
      <label htmlFor={'inquiry-' + name}>{label}</label>
      {props.as === 'textarea'
        ? <textarea id="inquiry-message" name="message" rows={5} minLength={10} maxLength={2000} value={values.message} onChange={change}
            aria-invalid={errors.message ? 'true' : undefined} aria-describedby="message-help message-error" />
        : <input id={'inquiry-' + name} name={name} value={values[name]} onChange={change} maxLength={props.maxLength}
            type={props.type} autoComplete={props.autoComplete}
            aria-invalid={errors[name] ? 'true' : undefined} aria-describedby={errors[name] ? name + '-error' : undefined} />}
      {props.as === 'textarea' && <p className="meta" id="message-help">Принаймні 10 символів.</p>}
      {errors[name] && <p className="field-error" id={name + '-error'}>{errors[name]}</p>}
    </div>
  );

  return (
    <main id="main" className="container contacts-page" tabIndex={-1}>
      <Breadcrumbs trail={[['Контакти']]} />
      <div className="page-intro">
        <h1>Контакти</h1>
        <p className="lead">Щоб дізнатися більше про виріб або обговорити індивідуальний задум, напишіть нам.</p>
      </div>
      <div className="contacts-layout">
        <section className="contact-channels" aria-labelledby="contact-channels-title">
          <h2 id="contact-channels-title">Зв’язок із виробником</h2>
          <div className="contact-channel">
            <p className="meta">Електронна пошта</p>
            <a className="text-link contact-email" href="mailto:mlhouse.shop@gmail.com"><LineIcon name="mail" /> mlhouse.shop@gmail.com <Icon name="arrow" /></a>
          </div>
          <div className="inquiry-tip">
            <h3>Що додати до запиту</h3>
            <p>Вкажіть модель або опишіть задум, бажані розміри та форму. Так буде легше зрозуміти, який виріб ви шукаєте.</p>
          </div>
        </section>

        <section id="inquiry" className="inquiry-panel" aria-labelledby="inquiry-title">
          <h2 id="inquiry-title">Підготуйте запит</h2>
          {record && (
            <div className="inquiry-context">
              <p className="meta">{kind === 'product' ? 'Виріб із каталогу' : 'Робота з портфоліо'}</p>
              <Link to={kind === 'product' ? productPath(record.slug) : workPath(record.slug)}>{record.title}</Link>
            </div>
          )}
          <form id="inquiry-form" noValidate onSubmit={submit}>
            <p className="meta required-note">Поля, позначені *, обов’язкові.</p>
            <div className="form-field">
              <label htmlFor="inquiry-type">Тема запиту</label>
              <select id="inquiry-type" name="type" value={type} onChange={event => { setType(event.target.value); setMailto(''); }}>
                {Object.entries(inquirySubjects).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="form-columns">
              {field('name', 'Ім’я *', { autoComplete: 'name', maxLength: 100 })}
              {field('email', 'Електронна пошта *', { type: 'email', autoComplete: 'email', maxLength: 254 })}
            </div>
            <div className="form-field">
              <label htmlFor="inquiry-phone">Телефон <span className="meta">(необов’язково)</span></label>
              <input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} value={values.phone} onChange={change} />
            </div>
            {field('message', 'Повідомлення *', { as: 'textarea' })}
            <div className="inquiry-actions">
              <button className="button button--primary" type="submit">Підготувати лист <Icon name="arrow" /></button>
              {mailto && (
                <div className="inquiry-draft">
                  <p id="form-status" className="meta" role="status">Чернетка готова. Відкрийте її в поштовій програмі, щоб надіслати лист.</p>
                  <a className="text-link" href={mailto} aria-describedby="form-status">Відкрити чернетку <Icon name="external" /></a>
                </div>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
