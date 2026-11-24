import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { adminFetch } from '../../lib/adminApi.js';
import { usePageTitle } from '../../lib/usePageTitle.js';

function Login({ configured, onDone }) {
  const [values, setValues] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    const { ok, data } = await adminFetch('/login', { method: 'POST', body: values });
    setBusy(false);
    if (ok) onDone(); else setError(data?.error ?? 'Не вдалося увійти');
  };
  return (
    <main className="admin-login">
      <form className="admin-card" onSubmit={submit}>
        <h1>Вхід в адмінку</h1>
        {!configured && <p className="field-error">Адмінку не налаштовано: додайте ADMIN_LOGIN і ADMIN_PASSWORD у .env</p>}
        <div className="form-field"><label htmlFor="a-login">Логін</label>
          <input id="a-login" autoComplete="username" value={values.login} onChange={e => setValues({ ...values, login: e.target.value })} /></div>
        <div className="form-field"><label htmlFor="a-pass">Пароль</label>
          <input id="a-pass" type="password" autoComplete="current-password" value={values.password} onChange={e => setValues({ ...values, password: e.target.value })} /></div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Входимо…' : 'Увійти'}</button>
      </form>
    </main>
  );
}

export default function AdminLayout() {
  usePageTitle('Адмінка');
  const [state, setState] = useState({ status: 'loading', configured: true });
  const check = () => adminFetch('/me').then(
    ({ data }) => setState({ status: data?.admin ? 'in' : 'out', configured: data?.configured ?? false }),
    () => setState({ status: 'error', configured: true }),
  );
  useEffect(() => { check(); }, []);

  if (state.status === 'loading') return <p className="meta admin-shell" role="status">Завантаження…</p>;
  if (state.status === 'error') return <p className="field-error admin-shell" role="alert">Сервер недоступний.</p>;
  if (state.status === 'out') return <Login configured={state.configured} onDone={check} />;

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <strong>MILLINGHOUSE · Адмінка</strong>
        <nav aria-label="Розділи адмінки">
          <NavLink to="/admin/orders">Замовлення</NavLink>
          <NavLink to="/admin/products">Товари</NavLink>
          <a href="/">На сайт</a>
        </nav>
        <button type="button" className="text-link" onClick={async () => { await adminFetch('/logout', { method: 'POST' }); check(); }}>Вийти</button>
      </header>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
