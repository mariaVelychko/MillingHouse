(async () => {
  'use strict';

  const { loadData } = globalThis.millinghouse['data'];
  const { emptyState, escapeHTML, icon, itemForms, loadError, pluralCount, productCard, relevance, route, workCards } = globalThis.millinghouse['common'];

  const query = document.querySelector('#global-query');
  const status = document.querySelector('#search-status');
  const results = document.querySelector('#search-results');
  const term = (new URLSearchParams(location.search).get('q') ?? '').trim().slice(0, 120);
  query.value = term;

  if (term) {
    try {
      const [products, works, taxonomy, images] = await loadData('products', 'works', 'taxonomy', 'media');
      const groups = [
        { records: products, kind: 'product', label: 'Каталог', archive: 'catalog' },
        { records: works, kind: 'work', label: 'Портфоліо', archive: 'portfolio' },
      ];
      let total = 0;
      const rendered = groups.map(({ records, kind, label, archive }) => {
        const matches = records.map(record => ({ record, score: relevance(record, term, taxonomy) }))
          .filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score);
        total += matches.length;
        if (!matches.length) return '';
        const visible = matches.slice(0, 6).map(({ record }) => record);
        const cards = kind === 'work'
          ? workCards(visible, taxonomy, images)
          : visible.map(record => productCard(record, taxonomy, images)).join('');
        return '<section class="search-group"><div class="section-heading"><div><h2>' + label + '</h2>' +
          '<p class="meta">' + pluralCount(matches.length, itemForms[kind]) + '</p></div>' +
          '<a class="text-link" href="' + escapeHTML(route(archive, { q: term })) + '">Усі збіги ' + icon('arrow') + '</a></div>' +
          '<div class="card-grid">' + cards + '</div></section>';
      });
      status.textContent = '«' + term + '» · ' + pluralCount(total, itemForms.match);
      results.innerHTML = total ? rendered.join('') : emptyState('Нічого не знайдено',
        'Перевірте написання або спробуйте коротший запит.');
    } catch (error) {
      console.error(error);
      status.textContent = '';
      loadError(results);
    }
  } else {
    status.textContent = 'Введіть назву виробу, категорію або сюжет різьблення.';
  }
})();
