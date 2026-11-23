import { Breadcrumbs, LoadError } from '../components/Ui.jsx';
import { Icon } from '../components/Icon.jsx';
import { Link } from 'react-router-dom';
import Archive from '../components/Archive.jsx';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';

export function CustomBand() {
  return (
    <section className="custom-band custom-band--compact" aria-labelledby="custom-title">
      <div className="custom-band__photo" aria-hidden="true" />
      <div className="container custom-band__inner">
        <img className="custom-band__compass" src="/assets/img/brand/drafting-compass.svg" width="96" height="96" alt="" loading="lazy" decoding="async" />
        <div className="custom-band__copy">
          <h2 id="custom-title">Індивідуальне виготовлення</h2>
          <p>Обговоримо виріб за вашим ескізом, розміром або ідеєю.</p>
        </div>
        <Link className="button button--primary" to="/contacts?type=custom#inquiry">Обговорити проєкт <Icon name="arrow" /></Link>
      </div>
    </section>
  );
}

export function Banner({ title, lead, trail }) {
  return (
    <header className="archive-banner">
      <div className="container">
        <Breadcrumbs trail={trail} />
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
    </header>
  );
}

export default function Catalog() {
  usePageTitle('Каталог виробів');
  const { status, data } = useSiteData();
  return (
    <main id="main" className="archive-page catalog-page" tabIndex={-1}>
      <Banner title="Каталог виробів" trail={[['Каталог']]}
        lead="Вироби з натурального дерева: лампи, панно, іграшки та церковні вироби. Оберіть категорію та знайдіть потрібну модель." />
      {status === 'ready'
        ? <Archive kind="product" records={data.products} taxonomy={data.taxonomy} images={data.media} pageSize={6} />
        : <div className="container">{status === 'error' ? <LoadError /> : <p className="meta" role="status">Завантаження…</p>}</div>}
      <CustomBand />
    </main>
  );
}
