(async () => {
  'use strict';

  const { loadData } = globalThis.millinghouse['data'];
  const { connectDialog, emptyState, escapeHTML, icon, itemForms, lineIcon, loadError, pluralCount, productCard, route, workCards } = globalThis.millinghouse['common'];
  const { archiveOptions, hasFilters, matchingRecords, priceBound, readState, toParams } = globalThis.millinghouse['archive-state'];
  const { renderPortfolioFeature } = globalThis.millinghouse['portfolio-feature'];

  const portfolio = document.body.dataset.page === 'portfolio';
  const kind = portfolio ? 'work' : 'product';
  const archive = portfolio ? 'portfolio' : 'catalog';
  const pageSize = portfolio ? 9 : 6;
  const get = id => document.getElementById(id);
  const ui = {
    categories: get('archive-categories'),
    search: get('archive-search'),
    query: get('archive-query'),
    sort: get('archive-sort'),
    desktop: get('desktop-filters'),
    mobile: get('mobile-filters'),
    trigger: get('open-filters'),
    dialog: get('filter-dialog'),
    feature: get('archive-feature'),
    searchControls: get('portfolio-search'),
    archive: get('portfolio-archive'),
    controls: get('archive-controls'),
    count: get('results-count'),
    heading: get('results-heading'),
    chips: get('filter-chips'),
    grid: get('archive-grid'),
    pagination: get('archive-pagination'),
    layout: [...document.querySelectorAll('.view-switch [data-layout]')],
  };

  function initialize(records, taxonomy, images, hasFeature) {
    const options = archiveOptions(records, taxonomy, kind);
    const viewport = matchMedia('(min-width: 901px)');
    const read = () => readState(new URLSearchParams(location.search), options);
    const clear = () => ({ ...readState(new URLSearchParams(), options), archive: state.archive, view: state.view });
    const url = state => route(archive, toParams(state));
    let state = read();
    let results = [];
    let pageCount = 1;

    ui.desktop.innerHTML = '<div class="filter-sidebar__head"><h2>Фільтри</h2>' +
      '<button class="filter-reset" type="button" data-reset>Очистити все</button></div>' +
      facetsHTML(options) + (options.hasPrice ? '<form class="price-form">' + priceHTML() +
        '<button type="submit" class="button button--primary">' + icon('filter') + 'Застосувати фільтри</button></form>' : '');

    ui.mobile.innerHTML = '<form class="mobile-filter-form"><div class="mobile-filter-form__fields">' +
      facetsHTML(options) + (options.hasPrice ? priceHTML() : '') + '</div>' +
      '<div class="mobile-filter-form__actions"><button class="filter-reset" type="button" data-reset>Скинути</button>' +
      '<button class="button button--primary" type="submit" data-apply>Показати</button></div></form>';

    const mobileForm = ui.mobile.querySelector('form');
    const priceForm = ui.desktop.querySelector('.price-form');
    const applyButton = mobileForm.querySelector('[data-apply]');

    for (const form of [priceForm, options.hasPrice ? mobileForm : null].filter(Boolean)) {
      form.addEventListener('invalid', event => { event.target.closest('details').open = true; }, true);
    }

    function syncFilters(container, selection) {
      for (const input of container.querySelectorAll('input[type=checkbox]')) {
        input.checked = selection.filters[input.name]?.includes(input.value) ?? false;
      }
      for (const input of container.querySelectorAll('input[type=number]')) {
        input.value = selection[input.name] ?? '';
        input.setCustomValidity('');
      }
    }

    function formPrice(form) {
      if (!options.hasPrice) return { minPrice: null, maxPrice: null };
      const lower = form.elements.minPrice;
      const upper = form.elements.maxPrice;
      const minPrice = priceBound(lower.value);
      const maxPrice = priceBound(upper.value);
      const reversed = minPrice !== null && maxPrice !== null && minPrice > maxPrice;
      upper.setCustomValidity(reversed ? 'Верхня межа має бути не меншою за нижню.' : '');
      if (!lower.validity.valid || !upper.validity.valid) return null;
      return { minPrice, maxPrice };
    }

    function mobileSelection() {
      const price = formPrice(mobileForm);
      if (!price) return null;
      const data = new FormData(mobileForm);
      const filters = Object.fromEntries(options.facets.map(({ key }) => [key, data.getAll(key)]));
      return { ...state, ...price, filters, page: 1 };
    }

    function updatePreview() {
      const preview = mobileSelection();
      const count = preview ? matchingRecords(records, preview, taxonomy).length : null;
      applyButton.textContent = count === null ? 'Перевірте діапазон' : 'Показати ' + pluralCount(count, itemForms[kind]);
    }

    function update(next, { replace = false, focusResults = false } = {}) {
      state = next;
      results = matchingRecords(records, state, taxonomy);
      pageCount = Math.max(1, Math.ceil(results.length / pageSize));
      state = { ...state, page: Math.min(state.page, pageCount) };

      const target = url(state) + (replace ? location.hash : '');
      const current = location.pathname.split('/').at(-1) + location.search + location.hash;
      if (target !== current) {
        const method = replace ? 'replaceState' : 'pushState';
        history[method](null, '', target);
      }

      const focusedCategory = ui.categories.contains(document.activeElement) ? document.activeElement.dataset.category : undefined;
      ui.categories.innerHTML = categoryLinks(records, state, options, url, kind);
      if (focusedCategory !== undefined) {
        [...ui.categories.querySelectorAll('a')].find(link => link.dataset.category === focusedCategory)?.focus({ preventScroll: true });
      }

      ui.query.value = state.q;
      ui.sort.options[0].textContent = state.q ? 'За релевантністю' : options.sort[0][1];
      ui.sort.value = state.sort;
      syncFilters(ui.desktop, state);

      const changed = Boolean(state.q) || hasFilters(state);
      const canReset = changed || state.sort !== 'default';
      ui.desktop.querySelector('[data-reset]').disabled = !canReset;
      const showFeature = hasFeature && !canReset && !state.archive && state.page === 1;
      if (ui.feature) ui.feature.hidden = !showFeature;
      if (ui.archive) ui.archive.hidden = showFeature;
      if (replace && state.archive && location.hash === '#archive-results') {
        requestAnimationFrame(() => get('archive-results').scrollIntoView());
      }
      ui.grid.classList.toggle('card-grid--list', state.view === 'list');
      for (const button of ui.layout) button.setAttribute('aria-pressed', String(button.dataset.layout === state.view));
      ui.heading.textContent = changed ? 'Результати' : (portfolio ? 'Усі роботи' : 'Усі вироби');
      ui.count.textContent = 'Знайдено ' + pluralCount(results.length, itemForms[kind]);
      ui.chips.innerHTML = filterChips(state, options);
      ui.chips.hidden = !ui.chips.children.length;

      const start = (state.page - 1) * pageSize;
      const visible = results.slice(start, start + pageSize);
      if (!visible.length) {
        ui.grid.innerHTML = emptyState('Нічого не знайдено', 'Спробуйте іншу назву або змініть фільтри.',
          '<button class="button button--outline" type="button" data-clear-all>Скинути пошук і фільтри</button>');
      } else if (portfolio) {
        ui.grid.innerHTML = workCards(visible, taxonomy, images);
      } else {
        ui.grid.innerHTML = visible.map(record => productCard(record, taxonomy, images)).join('');
      }

      ui.pagination.innerHTML = pagination(state, pageCount, url);
      ui.pagination.hidden = pageCount < 2;
      if (focusResults && !showFeature) ui.heading.focus();
    }

    ui.categories.addEventListener('click', event => {
      const link = event.target.closest('a[data-category]');
      if (!link || modifiedClick(event)) return;
      event.preventDefault();
      const category = link.dataset.category;
      update({ ...state, filters: { ...state.filters, category: category ? [category] : [] }, page: 1 });
    });

    ui.search.addEventListener('submit', event => {
      event.preventDefault();
      const q = ui.query.value.trim();
      update({ ...state, q, archive: portfolio && (state.archive || Boolean(q)), page: 1 });
    });

    ui.sort.innerHTML = options.sort.map(([value, title]) =>
      '<option value="' + value + '">' + title + '</option>'
    ).join('');
    ui.sort.addEventListener('change', () => update({ ...state, sort: ui.sort.value, page: 1 }));
    for (const button of ui.layout) {
      button.addEventListener('click', () => update({ ...state, view: button.dataset.layout }));
    }

    ui.desktop.addEventListener('change', event => {
      const input = event.target;
      if (input.type !== 'checkbox') return;
      const values = [...ui.desktop.querySelectorAll('input[type=checkbox]:checked')]
        .filter(checked => checked.name === input.name).map(checked => checked.value);
      update({ ...state, filters: { ...state.filters, [input.name]: values }, page: 1 });
    });

    ui.desktop.querySelector('[data-reset]').addEventListener('click', () => {
      update(clear(), { focusResults: true });
    });

    if (priceForm) {
      priceForm.addEventListener('input', () => formPrice(priceForm));
      priceForm.addEventListener('submit', event => {
        event.preventDefault();
        const price = formPrice(priceForm);
        if (price) update({ ...state, ...price, page: 1 });
        else priceForm.reportValidity();
      });
    }

    ui.chips.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const { key, value } = button.dataset;
      const index = [...ui.chips.querySelectorAll('button')].indexOf(button);
      if (key === 'all') update(clear());
      else if (key === 'q') update({ ...state, q: '', page: 1 });
      else if (key === 'price') update({ ...state, minPrice: null, maxPrice: null, page: 1 });
      else {
        const filters = { ...state.filters, [key]: state.filters[key].filter(id => id !== value) };
        update({ ...state, filters, page: 1 });
      }
      const next = ui.chips.querySelectorAll('button');
      (next[Math.min(index, next.length - 1)] ?? ui.heading).focus();
    });

    ui.grid.addEventListener('click', event => {
      if (event.target.closest('[data-clear-all]')) update(clear(), { focusResults: true });
    });

    ui.pagination.addEventListener('click', event => {
      const link = event.target.closest('a[data-page-number]');
      if (!link || modifiedClick(event)) return;
      event.preventDefault();
      update({ ...state, page: Number(link.dataset.pageNumber) }, { focusResults: true });
    });

    ui.trigger.addEventListener('click', () => {
      syncFilters(ui.mobile, state);
      updatePreview();
    });
    connectDialog(ui.dialog, ui.trigger);
    ui.dialog.querySelector('[data-close-filters]').addEventListener('click', () => ui.dialog.close());
    mobileForm.addEventListener('input', updatePreview);
    mobileForm.querySelector('[data-reset]').addEventListener('click', () => {
      syncFilters(ui.mobile, clear());
      updatePreview();
    });
    mobileForm.addEventListener('submit', event => {
      event.preventDefault();
      const next = mobileSelection();
      if (next) {
        update({ ...next, archive: portfolio || next.archive });
        ui.dialog.close();
      } else {
        mobileForm.reportValidity();
      }
    });
    viewport.addEventListener('change', event => {
      if (event.matches && ui.dialog.open) ui.dialog.close();
    });
    window.addEventListener('popstate', () => {
      if (ui.dialog.open) ui.dialog.close();
      update(read(), { replace: true });
    });
    update(state, { replace: true });
    ui.desktop.hidden = false;
    ui.controls.hidden = false;
    if (ui.searchControls) ui.searchControls.hidden = false;
  }

  function modifiedClick(event) {
    return event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  function categoryLinks(records, state, options, url, kind) {
    const selected = state.filters.category ?? [];
    const links = [{ id: '', icon: 'crucifix', title: kind === 'work' ? 'Усі роботи' : 'Усі вироби', count: records.length },
      ...options.categories.map(category => ({
        ...category, count: records.filter(record => record.category === category.id).length,
      })),
    ];
    const categories = links.map(({ id, icon: symbol, title, count }) => {
      const active = id ? selected.length === 1 && selected[0] === id : selected.length === 0;
      const filters = { ...state.filters, category: id ? [id] : [] };
      return '<a href="' + escapeHTML(url({ ...state, filters, page: 1 })) + '" data-category="' + id + '"' +
        (active ? ' aria-current="true"' : '') + '>' +
        (symbol && (id || kind === 'product') ? lineIcon(symbol) : '') +
        '<span class="category-nav__label">' + escapeHTML(title) +
        (kind === 'product' ? '<small class="category-nav__count">' +
          pluralCount(count, { one: 'модель', few: 'моделі', other: 'моделей' }) + '</small>' : '') + '</span></a>';
    }).join('');
    return categories + (kind === 'work'
      ? '<a class="category-nav__custom" href="#project-inquiry">' + lineIcon('star') +
        '<span class="category-nav__label">Індивідуальні проєкти</span></a>' : '');
  }

  function facetsHTML(options) {
    return options.facets.map(({ key, label, options }) =>
      '<details class="filter-section" open><summary>' + escapeHTML(label) + '</summary>' +
      '<fieldset class="filter-group"><legend class="sr-only">' + escapeHTML(label) + '</legend>' +
        options.map(option => '<label><input type="checkbox" name="' + key + '" value="' + escapeHTML(option.id) +
          '"><span>' + escapeHTML(option.label) + ' <span class="filter-count">(' + option.count +
          ')</span></span></label>').join('') + '</fieldset></details>'
    ).join('');
  }

  function priceHTML() {
    return '<details class="filter-section" open><summary>Ціна, грн</summary>' +
      '<fieldset class="filter-group"><legend class="sr-only">Ціна, грн</legend><div class="price-fields">' +
      '<label>Від <input type="number" name="minPrice" min="0" step="any" inputmode="decimal"></label>' +
      '<label>До <input type="number" name="maxPrice" min="0" step="any" inputmode="decimal"></label>' +
      '</div></fieldset></details>';
  }

  function filterChips(state, archive) {
    const chip = (key, label, value = '') =>
      '<li><button type="button" data-key="' + key + '" data-value="' + escapeHTML(value) +
      '" aria-label="Прибрати: ' + escapeHTML(label) + '">' + escapeHTML(label) + icon('close') + '</button></li>';
    const chips = [];
    if (state.q) chips.push(chip('q', '«' + state.q + '»'));
    for (const { key, options } of archive.facets) {
      for (const option of options) {
        if (state.filters[key].includes(option.id)) chips.push(chip(key, option.label, option.id));
      }
    }
    if (state.minPrice !== null || state.maxPrice !== null) {
      const bounds = [];
      if (state.minPrice !== null) bounds.push('від ' + state.minPrice);
      if (state.maxPrice !== null) bounds.push('до ' + state.maxPrice);
      chips.push(chip('price', bounds.join(' ') + ' грн'));
    }
    if (chips.length) chips.push('<li><button class="filter-reset" type="button" data-key="all">Скинути все</button></li>');
    return chips.join('');
  }

  function pagination(state, total, url) {
    if (total < 2) return '';
    const link = (page, label, content) => '<a href="' + escapeHTML(url({ ...state, page })) + '" data-page-number="' +
      page + '" aria-label="' + label + '"' + (page === state.page ? ' aria-current="page"' : '') + '>' + content + '</a>';
    const pages = new Set([1, total, state.page - 1, state.page, state.page + 1].filter(page => page >= 1 && page <= total));
    let html = state.page > 1 ? link(state.page - 1, 'Попередня сторінка', icon('arrow icon-back')) : '';
    let previous = 0;
    for (const page of [...pages].sort((a, b) => a - b)) {
      if (page - previous > 1) html += '<span aria-hidden="true">…</span>';
      html += link(page, 'Сторінка ' + page, page);
      previous = page;
    }
    if (state.page < total) html += link(state.page + 1, 'Наступна сторінка', icon('arrow'));
    return html;
  }

  try {
    const [records, taxonomy, images] = await loadData(portfolio ? 'works' : 'products', 'taxonomy', 'media');
    let hasFeature = false;
    if (portfolio) {
      const [site] = await loadData('site');
      hasFeature = renderPortfolioFeature(records, taxonomy, images, site);
    }
    initialize(records, taxonomy, images, hasFeature);
  } catch (error) {
    console.error(error);
    ui.desktop.hidden = true;
    ui.controls.hidden = true;
    if (ui.archive) ui.archive.hidden = false;
    ui.count.textContent = '';
    loadError(ui.grid);
  }
})();
