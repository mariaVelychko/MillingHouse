(() => {
  'use strict';

  const { categoryInfo, recordImages, resolveImage } = globalThis.millinghouse['data'];

  const escaped = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const centimetres = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });
  const pluralRules = new Intl.PluralRules('uk-UA');
  const collator = new Intl.Collator('uk-UA', { sensitivity: 'base', numeric: true });

  const itemForms = {
    product: { one: 'виріб', few: 'вироби', other: 'виробів' },
    work: { one: 'робота', few: 'роботи', other: 'робіт' },
    match: { one: 'збіг', few: 'збіги', other: 'збігів' },
  };

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => escaped[char]);
  }

  function icon(name) {
    return '<span class="icon icon-' + name + '" aria-hidden="true"></span>';
  }

  function lineIcon(name, className = 'line-icon') {
    return '<svg class="' + className + '" aria-hidden="true" focusable="false">' +
      '<use href="#line-icon-' + escapeHTML(name) + '"></use></svg>';
  }

  function route(page, parameters = {}) {
    const search = new URLSearchParams();
    for (const [name, values] of Object.entries(parameters)) {
      for (const value of [values].flat()) {
        if (value !== undefined && value !== null && value !== '') search.append(name, value);
      }
    }
    return page + '.html' + (search.size ? '?' + search : '');
  }

  function pluralCount(number, forms) {
    return number + ' ' + (forms[pluralRules.select(number)] ?? forms.other);
  }

  function compareNames(a, b) {
    return collator.compare(a, b);
  }

  function normalizeSearch(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase('uk')
      .replace(/['’ʼ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function relevance(record, query, taxonomy) {
    const tokens = normalizeSearch(query).split(' ').filter(Boolean);
    if (!tokens.length) return 0;

    const category = categoryInfo(taxonomy, record.category);
    const title = normalizeSearch(record.title);
    const primary = normalizeSearch([record.title, record.id, record.slug].join(' '));
    const searchable = normalizeSearch([
      primary, record.description, category?.title, category?.singular, ...(category?.searchTerms ?? []),
      taxonomy.materials[record.material], taxonomy.forms[record.form], sizeText(record),
    ].filter(Boolean).join(' '));

    if (!tokens.every(token => searchable.includes(token))) return -1;
    return tokens.reduce((score, token) => score + (title.includes(token) ? 3 : primary.includes(token) ? 2 : 1), 0);
  }

  function sizeCM(record) {
    return Number.isFinite(record.sizeInches) ? Math.round(record.sizeInches * 25.4) / 10 : null;
  }

  function sizeText(record) {
    const size = sizeCM(record);
    return size === null ? '' : centimetres.format(size) + ' см';
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency', currency: price.currency, currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2, minimumFractionDigits: 0,
    }).format(price.amount);
  }

  function media(image, options = {}) {
    const { eager = false, sizes = '100vw', full = false, detail = true } = options;
    if (!image) return '';

    const view = detail ? image.detail : null;
    const srcset = image.small && !full
      ? ' srcset="' + escapeHTML(image.small) + ' 640w, ' + escapeHTML(image.src) + ' ' + image.width + 'w" sizes="' + sizes + '"'
      : '';
    const style = view
      ? ' style="--media-scale:' + view.scale + ';--media-position:' + escapeHTML(view.position) + '"'
      : '';
    return '<span class="media' + (view ? ' media--detail' : '') + '"' + style + '>' +
      '<img src="' + escapeHTML(image.src) + '"' + srcset + ' width="' + image.width + '" height="' + image.height +
      '" alt="' + escapeHTML(image.alt) + '" decoding="async" loading="' + (eager ? 'eager' : 'lazy') + '"></span>';
  }

  function figureImage(image, options) {
    if (!image) return '';
    const caption = image.caption
      ? '<figcaption class="figure-caption">' + escapeHTML(image.caption) + '</figcaption>'
      : '';
    return '<div class="editorial-frame" style="--frame-ratio:' + (image.width / image.height) + '">' +
      media(image, options) + '</div>' + caption;
  }

  function productCard(record, taxonomy, images) {
    const category = categoryInfo(taxonomy, record.category);
    const image = recordImages(record, images)[0];
    const specs = [category?.title, sizeText(record)].filter(Boolean);
    const price = record.price
      ? '<span class="card__price">' + escapeHTML(formatPrice(record.price)) + '</span>'
      : '<span class="card__price meta">Ціну уточнюйте</span>';
    const cover = image?.card ? { ...image, ...image.card } : image;
    return '<article class="card' + (image ? '' : ' card--text') + '"><a class="card__link" href="' + route('product', { slug: record.slug }) + '">' +
      (image ? '<div class="card__image" style="--card-ratio:' + (cover.width / cover.height) + '">' +
        media(cover, { sizes: '(max-width: 900px) 46vw, 26vw' }) + '</div>' : '') +
      '<div class="card__body"><p class="meta card__spec">' + escapeHTML(specs.join(' · ')) + '</p>' +
      '<h3 class="card__title">' + escapeHTML(record.title) + '</h3>' +
      (image ? '' : '<p class="card__description">' + escapeHTML(record.description) + '</p>') +
      '<div class="card__footer">' + price + '<span class="sr-only">Переглянути товар</span>' +
      '<span class="card__action">' + icon('arrow') + '</span>' +
      '</div></div></a></article>';
  }

  function workCards(records, taxonomy, images) {
    const shown = new Set();
    const entries = records.map(record => {
      const image = recordImages(record, images)[0];
      const cover = image?.status === 'demo' && shown.has(image.src) ? null : image;
      if (cover) shown.add(cover.src);
      return { record, cover };
    });
    const render = (items, heading = 'h3') => items
      .map(({ record, cover }) => workCard(record, taxonomy, cover, heading)).join('');
    const firstText = entries.findIndex(({ cover }) => !cover);

    if (firstText === -1) return render(entries);

    const tail = entries.slice(firstText);
    if (firstText === 1 || tail.some(({ cover }) => cover)) {
      return '<div class="work-results-list">' + render(entries) + '</div>';
    }

    const gallery = render(entries.slice(0, firstText));
    const title = firstText ? '<h3 class="work-index__title">Більше робіт</h3>' : '';
    return gallery + '<div class="work-index">' + title + '<div class="work-index__list">' +
      render(tail, firstText ? 'h4' : 'h3') + '</div></div>';
  }

  function workCard(record, taxonomy, image, heading = 'h3') {
    const category = categoryInfo(taxonomy, record.category);
    const specs = [category?.title, taxonomy.materials[record.material]].filter(Boolean);
    return '<article class="work-card' + (image ? '' : ' work-card--text') + '"><a class="work-card__link" href="' +
      route('work', { slug: record.slug }) + '">' +
      (image ? '<div class="work-card__image">' + media(image, { sizes: '(max-width: 900px) 46vw, 34vw' }) + '</div>' : '') +
      '<div class="work-card__body"><p class="meta">' + escapeHTML(specs.join(' · ')) + '</p>' +
      '<' + heading + '>' + escapeHTML(record.title) + '</' + heading + '>' +
      (image ? '' : '<p class="card__description">' + escapeHTML(record.description) + '</p>') +
      '<span class="work-card__arrow"><span class="sr-only">Переглянути роботу</span>' + icon('arrow') + '</span></div></a></article>';
  }

  function categoryCard(category, images) {
    const image = resolveImage(images, category.editorialImage ?? category.image);
    return '<a class="category-card" href="' + route('catalog', { category: category.id }) + '">' +
      (image ? '<div class="category-card__image">' + media(image, { sizes: '(max-width: 720px) 27vw, 25vw' }) + '</div>' : '') +
      '<div class="category-card__body"><h3>' + escapeHTML(category.title) + '</h3>' + icon('arrow') + '</div></a>';
  }

  function mosaicCard(record, taxonomy, images, lead = false) {
    const category = categoryInfo(taxonomy, record.category);
    const [full, detail] = recordImages(record, images);
    const image = detail ?? full;
    return '<a class="mosaic-card' + (lead ? ' mosaic-card--lead' : '') + (image ? '' : ' mosaic-card--text') +
      '" href="' + route('work', { slug: record.slug }) + '">' +
      (image ? '<div class="mosaic-card__media">' +
        media(image, { sizes: lead ? '(max-width: 850px) 94vw, 56vw' : '(max-width: 850px) 46vw, 22vw' }) + '</div>' : '') +
      '<div class="mosaic-card__body"><p class="meta">' + escapeHTML(category?.title) + '</p>' +
      '<h3>' + escapeHTML(record.title) + '</h3>' +
      (lead ? '<p class="mosaic-card__description">' + escapeHTML(record.description) + '</p>' : '') +
      icon('arrow') + '</div></a>';
  }

  function emptyState(title, message, action = '') {
    return '<div class="empty-state"><h2>' + escapeHTML(title) + '</h2><p>' + escapeHTML(message) + '</p>' + action + '</div>';
  }

  function loadError(target) {
    target.innerHTML = emptyState('Не вдалося відкрити розділ', 'Спробуйте оновити сторінку.');
  }

  function connectDialog(dialog, trigger) {
    trigger?.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (trigger?.getClientRects().length) trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )].filter(element => element.getClientRects().length);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  globalThis.millinghouse['common'] = {
    itemForms,
    escapeHTML,
    icon,
    lineIcon,
    route,
    pluralCount,
    compareNames,
    normalizeSearch,
    relevance,
    sizeCM,
    sizeText,
    formatPrice,
    media,
    figureImage,
    productCard,
    workCards,
    categoryCard,
    mosaicCard,
    emptyState,
    loadError,
    connectDialog,
  };
})();
