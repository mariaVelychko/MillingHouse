import { Link } from 'react-router-dom';
import { categoryInfo, recordImages } from '../lib/data.js';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon, LineIcon } from '../components/Icon.jsx';
import Media from '../components/Media.jsx';
import Archive from '../components/Archive.jsx';
import { LoadError } from '../components/Ui.jsx';
import { workPath } from '../components/Cards.jsx';
import { Banner } from './Catalog.jsx';

function Feature({ records, taxonomy, images, site }) {
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
  const project = bySlug.get(site.projectWorkSlug);
  const [full, detail] = project ? recordImages(project, images) : [];
  return { tiles, project, full, detail };
}

function Showcase({ tiles, taxonomy }) {
  return (
    <section id="archive-feature" className="container portfolio-feature" aria-labelledby="portfolio-feature-title">
      <h2 id="portfolio-feature-title" className="sr-only">Вибрані роботи</h2>
      <div className="portfolio-showcase" data-count={tiles.length}>
        {tiles.map(({ record, image, tone }, index) => {
          const classes = ['showcase-tile', index === 0 && 'showcase-tile--lead', tone === 'light' && 'showcase-tile--light',
            tone === 'light' && image.card && 'showcase-tile--framed'].filter(Boolean).join(' ');
          const cover = tone === 'light' && image.card ? { ...image, ...image.card } : image;
          return (
            <Link key={record.slug} className={classes} to={workPath(record.slug)}>
              <Media image={cover} eager={index === 0} sizes={index === 0 ? '(max-width: 580px) 93vw, 44vw' : '(max-width: 580px) 45vw, 24vw'} />
              <div className="showcase-tile__caption"><p>{categoryInfo(taxonomy, record.category)?.title}</p><h3>{record.title}</h3><Icon name="arrow" /></div>
            </Link>
          );
        })}
      </div>
      <div className="portfolio-more">
        <Link className="button button--outline" to="/portfolio?archive=1#archive-results">Показати більше робіт <Icon name="down" /></Link>
      </div>
    </section>
  );
}

function Project({ project, full, detail }) {
  return (
    <section id="portfolio-project" className="container portfolio-project" aria-labelledby="project-title">
      <div className="project-spotlight">
        <div className="project-spotlight__body">
          <p className="eyebrow">Вибрана робота</p>
          <h2 id="project-title">{project.title}</h2>
          <p>{project.description}</p>
          <Link className="button button--light" to={workPath(project.slug)}>Переглянути роботу <Icon name="arrow" /></Link>
        </div>
        <div className="project-spotlight__image"><Media image={detail ?? full} sizes="(max-width: 630px) 93vw, 53vw" /></div>
      </div>
    </section>
  );
}

const steps = [
  ['model', 'Ідея та ескіз', 'Обговорюємо задум і форму.'],
  ['wood', 'Підготовка', 'Розробляємо модель і добираємо деревину.'],
  ['cnc', 'Виготовлення', 'Переносимо рельєф у дерево.'],
  ['layers', 'Оздоблення', 'Оглядаємо поверхню й деталі різьблення.'],
];

export default function Portfolio() {
  usePageTitle('Портфоліо');
  const { status, data } = useSiteData();
  const ready = status === 'ready';
  const parts = ready ? Feature({ records: data.works, taxonomy: data.taxonomy, images: data.media, site: data.site }) : null;
  const hasFeature = Boolean(parts?.tiles.length);
  return (
    <main id="main" className="archive-page portfolio-page" tabIndex={-1}>
      <Banner title="Портфоліо" trail={[['Портфоліо']]}
        lead="Роботи зблизька: роздивіться композицію, глибину рельєфу та текстуру дерева." />
      {ready
        ? <Archive kind="work" records={data.works} taxonomy={data.taxonomy} images={data.media} pageSize={9} hasFeature={hasFeature}
            feature={hasFeature && <><Showcase tiles={parts.tiles} taxonomy={data.taxonomy} />
              {parts.project && parts.full && <Project project={parts.project} full={parts.full} detail={parts.detail} />}</>} />
        : <div className="container">{status === 'error' ? <LoadError /> : <p className="meta" role="status">Завантаження…</p>}</div>}
      <section id="project-inquiry" className="container project-inquiry" aria-labelledby="project-inquiry-title">
        <h2 id="project-inquiry-title" className="sr-only">Індивідуальне виготовлення</h2>
        <ol className="project-process">
          {steps.map(([icon, title, text]) => <li key={title}><LineIcon name={icon} /><div><h3>{title}</h3><p>{text}</p></div></li>)}
        </ol>
        <Link className="text-link" to="/contacts?type=custom#inquiry">Обговорити індивідуальний проєкт <Icon name="arrow" /></Link>
      </section>
    </main>
  );
}
