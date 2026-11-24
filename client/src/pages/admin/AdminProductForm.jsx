import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminFetch, emptyProduct, formToProduct, productToForm } from '../../lib/adminApi.js';

const labels = {
  title: 'Назва *', slug: 'Адреса (slug)', sku: 'Артикул', priceUah: 'Ціна, грн', oldPriceUah: 'Стара ціна, грн',
  heightCm: 'Висота, см', widthCm: 'Ширина, см', material: 'Матеріал (wood / plastic / metal)',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(emptyProduct);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [loaded, setLoaded] = useState(!editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch('/categories').then(({ data }) => setCategories(data ?? []));
    if (editing) {
      adminFetch('/products/' + id).then(({ ok, data }) => {
        if (ok) { setValues(productToForm(data)); setLoaded(true); } else setFailure('Товар не знайдено.');
      });
    }
  }, [id, editing]);

  const change = event => {
    const { name, value, type, checked } = event.target;
    setValues(v => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setErrors({}); setFailure('');
    const { ok, status, data } = await adminFetch(editing ? '/products/' + id : '/products', {
      method: editing ? 'PUT' : 'POST', body: formToProduct(values),
    });
    setBusy(false);
    if (ok) navigate('/admin/products');
    else if (status === 400 && data?.errors) setErrors(data.errors);
    else setFailure('Не вдалося зберегти товар.');
  };

  const input = (name, props = {}) => (
    <div className="form-field">
      <label htmlFor={'p-' + name}>{labels[name]}</label>
      <input id={'p-' + name} name={name} value={values[name]} onChange={change} {...props}
        aria-invalid={errors[name] ? 'true' : undefined} aria-describedby={errors[name] ? name + '-error' : undefined} />
      {errors[name] && <p className="field-error" id={name + '-error'}>{errors[name]}</p>}
    </div>
  );

  if (!loaded) return failure ? <p className="field-error" role="alert">{failure}</p> : <p className="meta" role="status">Завантаження…</p>;
  return (
    <>
      <div className="admin-head"><h1>{editing ? 'Редагування товару' : 'Новий товар'}</h1><Link className="text-link" to="/admin/products">← До списку</Link></div>
      <form className="admin-card admin-form" onSubmit={submit} noValidate>
        {input('title', { maxLength: 200 })}
        <div className="form-columns">{input('slug', { maxLength: 100, placeholder: 'залиште порожнім — створиться з назви' })}{input('sku', { maxLength: 60 })}</div>
        <div className="form-field">
          <label htmlFor="p-category">Категорія *</label>
          <select id="p-category" name="categorySlug" value={values.categorySlug} onChange={change} aria-invalid={errors.categorySlug ? 'true' : undefined}>
            <option value="">— оберіть —</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
          {errors.categorySlug && <p className="field-error">{errors.categorySlug}</p>}
        </div>
        <div className="form-columns">{input('priceUah', { inputMode: 'numeric' })}{input('oldPriceUah', { inputMode: 'numeric' })}</div>
        <div className="form-columns">{input('heightCm', { inputMode: 'decimal' })}{input('widthCm', { inputMode: 'decimal' })}</div>
        {input('material', { maxLength: 40 })}
        <label className="choice"><input type="checkbox" name="inStock" checked={values.inStock} onChange={change} /><span>В наявності</span></label>
        <div className="form-field">
          <label htmlFor="p-colors">Кольори (через кому)</label>
          <input id="p-colors" name="colors" value={values.colors} onChange={change} />
        </div>
        <div className="form-field">
          <label htmlFor="p-images">Посилання на фото (по одному в рядку)</label>
          <textarea id="p-images" name="imageUrls" rows={4} value={values.imageUrls} onChange={change} aria-invalid={errors.imageUrls ? 'true' : undefined} />
          {errors.imageUrls && <p className="field-error">{errors.imageUrls}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="p-desc">Опис</label>
          <textarea id="p-desc" name="description" rows={6} value={values.description} onChange={change} />
        </div>
        {failure && <p className="field-error" role="alert">{failure}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти'}</button>
      </form>
    </>
  );
}
