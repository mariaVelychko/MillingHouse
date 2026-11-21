(() => {
  'use strict';

  const { categoryInfo, recordImages } = globalThis.millinghouse['data'];
  const { escapeHTML, icon, media, route } = globalThis.millinghouse['common'];

  function renderPortfolioFeature(records, taxonomy, images, site) {
    const bySlug = new Map(records.map(record => [record.slug, record]));
    const seen = new Set();
    const tiles = (site.portfolioFeature ?? []).flatMap(({ slug, frame, tone }) => {
      const record = bySlug.get(slug);
      if (!record) return [];
      const image = recordImages(record, images)[frame];
      const key = image && image.src + '|' + (image.detail?.position ?? '');
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{ record, image, tone }];
    });

    const grid = document.querySelector('#portfolio-mosaic');
    grid.dataset.count = tiles.length;
    grid.innerHTML = tiles.map(({ record, image, tone }, index) => {
      const classes = ['showcase-tile'];
      if (index === 0) classes.push('showcase-tile--lead');
      if (tone === 'light') classes.push('showcase-tile--light');
      if (tone === 'light' && image.card) classes.push('showcase-tile--framed');
      const category = categoryInfo(taxonomy, record.category);
      const cover = tone === 'light' && image.card ? { ...image, ...image.card } : image;
      return '<a class="' + classes.join(' ') + '" href="' + route('work', { slug: record.slug }) + '">' +
        media(cover, { eager: index === 0, sizes: index === 0 ? '(max-width: 580px) 93vw, 44vw' : '(max-width: 580px) 45vw, 24vw' }) +
        '<div class="showcase-tile__caption"><p>' + escapeHTML(category?.title) + '</p><h3>' +
        escapeHTML(record.title) + '</h3>' + icon('arrow') + '</div></a>';
    }).join('');

    const project = bySlug.get(site.projectWorkSlug);
    const [full, detail] = project ? recordImages(project, images) : [];
    if (project && full) {
      document.querySelector('#project-title').textContent = project.title;
      document.querySelector('#project-description').textContent = project.description;
      document.querySelector('#project-link').href = route('work', { slug: project.slug });
      document.querySelector('#project-image').innerHTML = media(detail ?? full, { sizes: '(max-width: 630px) 93vw, 53vw' });
      document.querySelector('#portfolio-project').hidden = false;
    }
    return tiles.length > 0;
  }

  globalThis.millinghouse['portfolio-feature'] = {
    renderPortfolioFeature,
  };
})();
