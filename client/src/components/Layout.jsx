import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, LineIcon } from './Icon.jsx';
import Sprite from './Sprite.jsx';
import { useCart } from '../context/Cart.jsx';

const nav = [
  ['/', 'Головна', 'home'],
  ['/catalog', 'Каталог', 'catalog'],
  ['/portfolio', 'Портфоліо', 'portfolio'],
  ['/about', 'Про нас', 'about'],
  ['/contacts', 'Контакти', 'contacts'],
];

// Розділ, який підсвічується в меню (сторінки товару/роботи належать каталогу/портфоліо)
function currentSection(pathname) {
  const first = pathname.split('/')[1] ?? '';
  return ({ '': 'home', catalog: 'catalog', product: 'catalog', portfolio: 'portfolio', about: 'about', contacts: 'contacts', search: 'search', cart: 'cart', checkout: 'cart', order: 'cart' })[first];
}

function NavLinks({ section, pathname }) {
  return nav.map(([to, label, id]) => (
    <Link key={to} to={to}
      aria-current={id === section ? (pathname === to ? 'page' : 'true') : undefined}>{label}</Link>
  ));
}

function Header() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const menu = useRef(null);
  const section = currentSection(pathname);

  const close = () => { if (menu.current?.open) menu.current.close(); };
  useEffect(close, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 901px)');
    if (!desktop) return undefined;
    const onChange = event => { if (event.matches) close(); };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" to="/"><img src="/assets/img/brand/millinghouse.png" width="2170" height="725" alt="MILLINGHOUSE — вироби з дерева" /></Link>
        <nav className="site-nav" aria-label="Головна навігація"><NavLinks section={section} pathname={pathname} /></nav>
        <div className="header-actions">
          <Link className="button header-search" to="/search" aria-current={section === 'search' ? 'page' : undefined}>
            <Icon name="search" /><span className="header-search__label">Пошук</span>
          </Link>
          <Link className="button header-cart" to="/cart" aria-current={section === 'cart' ? 'page' : undefined}
            aria-label={count ? `Кошик, товарів: ${count}` : 'Кошик'}>
            <LineIcon name="cart" /><span className="header-search__label">Кошик</span>
            {count > 0 && <span className="header-cart__count">{count}</span>}
          </Link>
          <button className="icon-button menu-toggle" type="button" aria-label="Відкрити меню" aria-haspopup="dialog"
            aria-controls="menu-dialog" onClick={() => menu.current?.showModal?.()}><Icon name="menu" /></button>
        </div>
      </div>
      <dialog className="drawer" id="menu-dialog" aria-labelledby="menu-title" ref={menu}
        onClick={event => { if (event.target === menu.current) close(); }}>
        <div className="drawer__header">
          <h2 id="menu-title">Меню</h2>
          <button className="icon-button" type="button" autoFocus aria-label="Закрити меню" onClick={close}><Icon name="close" /></button>
        </div>
        <div className="drawer__body">
          <nav className="mobile-nav" aria-label="Головна навігація"><NavLinks section={section} pathname={pathname} /></nav>
          <Link className="button button--outline mobile-nav__inquiry" to="/contacts?type=custom#inquiry">
            Індивідуальний запит <Icon name="arrow" />
          </Link>
        </div>
      </dialog>
    </header>
  );
}

function Footer() {
  const { pathname } = useLocation();
  const section = currentSection(pathname);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Link className="brand" to="/"><img src="/assets/img/brand/millinghouse.png" width="2170" height="725" alt="MILLINGHOUSE — вироби з дерева" /></Link>
            <p>Вироби з натурального дерева: лампи, панно, іграшки та церковні вироби.</p>
          </div>
          <nav aria-label="Навігація в підвалі">
            <p className="site-footer__title">Розділи</p>
            <div className="footer-links"><NavLinks section={section} pathname={pathname} /></div>
          </nav>
          <div className="site-footer__contact">
            <p className="site-footer__title">Зв’язок</p>
            <a href="mailto:mlhouse.shop@gmail.com"><LineIcon name="mail" />mlhouse.shop@gmail.com</a>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© MILLINGHOUSE</p>
          <a className="text-link" href="#top">На початок <Icon name="up" /></a>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  // Нова сторінка відкривається з початку (якщо немає якоря)
  useEffect(() => { if (!window.location.hash) window.scrollTo?.(0, 0); }, [pathname]);
  return (
    <>
      <Sprite />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
