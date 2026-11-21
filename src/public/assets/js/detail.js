(async () => {
  'use strict';

  const { categoryInfo, findInOrder, loadData, recordImages } = globalThis.millinghouse['data'];
  const { emptyState, escapeHTML, formatPrice, icon, loadError, productCard, route, sizeText, workCards } = globalThis.millinghouse['common'];
  const { galleryHTML, initializeGallery } = globalThis.millinghouse['gallery'];

  const isWork = document.body.dataset.page === 'work';
  const kind = isWork ? 'work' : 'product';
  const archive = isWork ? 'portfolio' : 'catalog';
  const archiveTitle = isWork ? 'Портфоліо' : 'Каталог';
  const content = document.querySelector('#detail-content');
  const slug = new URLSearchParams(location.search).get('slug');

  try {
    const [products, works, taxonomy, images] = await loadData('products', 'works', 'taxonomy', 'media');
    const records = isWork ? works : products;
    const record = records.find(item => item.slug === slug);
    if (record) {
      const photos = recordImages(record, images);
      content.innerHTML = detailHTML(record, records, products, works, taxonomy, images, photos);
      document.title = record.title + ' — MILLINGHOUSE';
      initializeGallery(content.querySelector('.gallery'), photos);
    } else {
      const heading = isWork ? 'Роботу не знайдено' : 'Виріб не знайдено';
      content.innerHTML = breadcrumbs(heading) +
        emptyState(heading, 'Перевірте адресу або відкрийте добірку, щоб знайти потрібну сторінку.',
          '<a class="button button--primary" href="' + route(archive) + '">' +
            (isWork ? 'До портфоліо' : 'До каталогу') + ' ' + icon('arrow') + '</a>');
      content.querySelector('.empty-state h2').outerHTML = '<h1>' + heading + '</h1>';
      document.title = heading + ' — MILLINGHOUSE';
    }
  } catch (error) {
    console.error(error);
    loadError(content);
  }

  function breadcrumbs(title) {
    return '<nav class="breadcrumbs" aria-label="Навігаційний шлях"><ol>' +
      '<li><a href="index.html">Головна</a></li><li><a href="' + route(archive) + '">' + archiveTitle + '</a></li>' +
      '<li aria-current="page">' + escapeHTML(title) + '</li></ol></nav>';
  }

  function specificationTable(record, taxonomy) {
    const size = sizeText(record);
    const properties = [
      ['Матеріал', taxonomy.materials[record.material]],
      ['Форма', taxonomy.forms[record.form]],
      ['Розмір', size],
      ['Оздоблення', record.finish],
      ...(record.specs ?? []),
      ['Кольори основи', (record.colors ?? []).join(', ')],
    ].filter(([, value]) => value);
    if (!properties.length) return '';
    return '<table class="detail-specs"><caption class="sr-only">Характеристики</caption><tbody>' +
      properties.map(([name, value]) => '<tr><th scope="row">' + escapeHTML(name) + '</th><td>' + escapeHTML(value) + '</td></tr>').join('') +
      '</tbody></table>';
  }

  function detailHTML(record, records, products, works, taxonomy, images, photos) {
    const category = categoryInfo(taxonomy, record.category);
    const linked = isWork
      ? findInOrder(products, record.relatedProductSlugs ?? [])
      : findInOrder(works, record.relatedWorkSlugs ?? []);
    const related = relatedRecords(record, records, images, photos[0]);
    const inquiry = route('contacts', { type: isWork ? 'custom' : 'product', [kind]: record.slug }) + '#inquiry';
    const price = record.price
      ? '<p class="detail-price">' + escapeHTML(formatPrice(record.price)) + '</p>'
      : '<p class="detail-price meta">Ціну уточнюйте</p>';
    const catalogLink = isWork && linked.length
      ? '<a class="text-link" href="' + route('product', { slug: linked[0].slug }) + '">Переглянути в каталозі ' + icon('arrow') + '</a>'
      : '';
    const portfolioLinks = isWork ? '' : linked.map(work =>
      '<a class="text-link" href="' + route('work', { slug: work.slug }) + '">Робота в портфоліо ' + icon('arrow') + '</a>'
    ).join('');
    return breadcrumbs(record.title) +
      '<div class="detail-layout' + (photos.length ? '' : ' detail-layout--text') + '">' + galleryHTML(photos, record.title) + '<article class="detail-body">' +
        (category ? '<a class="text-link eyebrow detail-category" href="' + route(archive, { category: category.id }) + '">' +
          escapeHTML(category.title) + '</a>' : '') +
        '<h1>' + escapeHTML(record.title) + '</h1>' + (isWork ? '' : price) +
        '<p class="lead">' + escapeHTML(record.description) + '</p>' + specificationTable(record, taxonomy) +
        '<div class="detail-actions"><a class="button button--primary" href="' + inquiry + '">' +
          (isWork ? 'Обговорити подібний виріб' : 'Запитати про виріб') + ' ' + icon('arrow') + '</a>' +
          catalogLink + portfolioLinks + '</div></article></div>' +
      (related.length ? relatedSection(isWork ? 'Інші роботи' : 'Схожі вироби', related, kind, taxonomy, images) : '');
  }

  function relatedRecords(record, records, images, mainImage) {
    const candidates = records.filter(item => item.slug !== record.slug);
    const inCategory = candidates.filter(item => item.category === record.category);
    const outsideCategory = candidates.filter(item => item.category !== record.category);
    const ordered = [...inCategory, ...outsideCategory];
    const seen = new Set([mainImage?.src]);
    const distinct = ordered.filter(item => {
      const source = recordImages(item, images)[0]?.src;
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });
    const fallback = ordered.filter(item => !distinct.includes(item));
    return [...distinct, ...fallback].slice(0, 3);
  }

  function relatedSection(title, records, type, taxonomy, images) {
    const cards = type === 'work'
      ? workCards(records, taxonomy, images)
      : records.map(record => productCard(record, taxonomy, images)).join('');
    return '<section class="detail-section"><div class="section-heading"><h2>' + title + '</h2></div><div class="card-grid">' +
      cards + '</div></section>';
  }
})();
