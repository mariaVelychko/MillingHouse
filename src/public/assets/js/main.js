(() => {
  'use strict';

  const { connectDialog, icon, lineIcon } = globalThis.millinghouse['common'];

  const pages = [
    ['home', 'index.html', 'Головна'],
    ['catalog', 'catalog.html', 'Каталог'],
    ['portfolio', 'portfolio.html', 'Портфоліо'],
    ['about', 'about.html', 'Про нас'],
    ['contacts', 'contacts.html', 'Контакти'],
  ];
  const page = document.body.dataset.page;
  const current = { product: 'catalog', work: 'portfolio' }[page] ?? page;

  function brand() {
    return '<a class="brand" href="index.html"><img src="assets/img/brand/millinghouse.png" width="2170" height="725" alt="MILLINGHOUSE — вироби з дерева"></a>';
  }

  function navLinks() {
    const ariaCurrent = page === current ? 'page' : 'true';
    return pages.map(([id, href, title]) =>
      '<a href="' + href + '"' + (id === current ? ' aria-current="' + ariaCurrent + '"' : '') + '>' + title + '</a>'
    ).join('');
  }

  document.querySelector('[data-site-header]').innerHTML =
    '<div class="container site-header__inner">' + brand() +
      '<nav class="site-nav" aria-label="Головна навігація">' + navLinks() + '</nav>' +
      '<div class="header-actions"><a class="button header-search" href="search.html"' +
        (current === 'search' ? ' aria-current="page"' : '') + '>' + icon('search') +
        '<span class="header-search__label">Пошук</span></a>' +
        '<button class="icon-button menu-toggle" type="button" aria-label="Відкрити меню" aria-haspopup="dialog" aria-controls="menu-dialog">' +
        icon('menu') + '</button></div></div>' +
    '<dialog class="drawer" id="menu-dialog" aria-labelledby="menu-title">' +
      '<div class="drawer__header"><h2 id="menu-title">Меню</h2>' +
        '<button class="icon-button" type="button" data-close-menu autofocus aria-label="Закрити меню">' + icon('close') + '</button></div>' +
      '<div class="drawer__body"><nav class="mobile-nav" aria-label="Головна навігація">' + navLinks() + '</nav>' +
      '<a class="button button--outline mobile-nav__inquiry" href="contacts.html?type=custom#inquiry">Індивідуальний запит ' + icon('arrow') +
      '</a></div></dialog>';

  document.querySelector('[data-site-footer]').innerHTML =
    '<div class="container"><div class="site-footer__main">' +
      '<div class="site-footer__brand">' + brand() + '<p>Хрести, Голгофи та рельєфні панно з натурального дерева.</p></div>' +
      '<nav aria-label="Навігація в підвалі"><p class="site-footer__title">Розділи</p><div class="footer-links">' + navLinks() + '</div></nav>' +
      '<div class="site-footer__contact"><p class="site-footer__title">Зв’язок</p>' +
      '<a href="mailto:mlhouse.shop@gmail.com">' + lineIcon('mail') + 'mlhouse.shop@gmail.com</a></div>' +
      '</div><div class="site-footer__bottom"><p>© MILLINGHOUSE</p>' +
      '<a class="text-link" href="#top">На початок ' + icon('up') + '</a></div></div>';

  const menu = document.querySelector('#menu-dialog');
  const menuTrigger = document.querySelector('.menu-toggle');
  const desktop = matchMedia('(min-width: 901px)');

  connectDialog(menu, menuTrigger);
  menu.querySelector('[data-close-menu]').addEventListener('click', () => menu.close());
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.close()));
  desktop.addEventListener('change', event => {
    if (event.matches && menu.open) menu.close();
  });
})();
