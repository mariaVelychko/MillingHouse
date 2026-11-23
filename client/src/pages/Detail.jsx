import { Link, useParams } from 'react-router-dom';
import { categoryInfo, findInOrder, recordImages } from '../lib/data.js';
import { sizeText } from '../lib/format.js';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon } from '../components/Icon.jsx';
import { Breadcrumbs, EmptyState, LoadError, Price } from '../components/Ui.jsx';
import { Gallery } from '../components/Gallery.jsx';
import { ProductCard, WorkResults, productPath, workPath } from '../components/Cards.jsx';
import AddToCart from '../components/AddToCart.jsx';

function Specs({ record, taxonomy }) {
  const rows = [
    ['Матеріал', taxonomy.materials?.[record.material]],
    ['Форма', taxonomy.forms?.[record.form]],
    ['Розмір', sizeText(record)],
    ['Оздоблення', record.finish],
    ...(record.specs ?? []),
    ['Кольори основи', (record.colors ?? []).join(', ')],
  ].filter(([, value]) => value);
  if (!rows.length) return null;
  return (
    <table className="detail-specs">
      <caption className="sr-only">Характеристики</caption>
      <tbody>{rows.map(([name, value]) => <tr key={name}><th scope="row">{name}</th><td>{value}</td></tr>)}</tbody>
    </table>
  );
}

// Схожі записи: спершу з тієї ж категорії, з різними фото
export function relatedRecords(record, records, images, mainImage) {
  const candidates = records.filter(item => item.slug !== record.slug);
  const ordered = [...candidates.filter(item => item.category === record.category), ...candidates.filter(item => item.category !== record.category)];
  const seen = new Set([mainImage?.src]);
  const distinct = ordered.filter(item => {
    const source = recordImages(item, images)[0]?.src;
    if (seen.has(source)) return false;
    seen.add(source);
    return true;
  });
  return [...distinct, ...ordered.filter(item => !distinct.includes(item))].slice(0, 3);
}

export default function Detail({ kind }) {
  const { slug } = useParams();
  const { status, data } = useSiteData();
  const isWork = kind === 'work';
  const archiveTitle = isWork ? 'Портфоліо' : 'Каталог';
  const archivePath = isWork ? '/portfolio' : '/catalog';
  const record = status === 'ready' ? (isWork ? data.works : data.products).find(item => item.slug === slug) : null;
  usePageTitle(status === 'ready' ? (record ? record.title : isWork ? 'Роботу не знайдено' : 'Виріб не знайдено') : '');

  if (status === 'loading') return <main id="main" className="container detail-page" tabIndex={-1}><p className="meta" role="status">Завантаження…</p></main>;
  if (status === 'error') return <main id="main" className="container detail-page" tabIndex={-1}><LoadError /></main>;

  if (!record) {
    const heading = isWork ? 'Роботу не знайдено' : 'Виріб не знайдено';
    return (
      <main id="main" className="container detail-page" tabIndex={-1}>
        <Breadcrumbs trail={[[archiveTitle, archivePath], [heading]]} />
        <EmptyState heading="h1" title={heading} message="Перевірте адресу або відкрийте добірку, щоб знайти потрібну сторінку.">
          <Link className="button button--primary" to={archivePath}>{isWork ? 'До портфоліо' : 'До каталогу'} <Icon name="arrow" /></Link>
        </EmptyState>
      </main>
    );
  }

  const { taxonomy, media: images } = data;
  const records = isWork ? data.works : data.products;
  const photos = recordImages(record, images);
  const category = categoryInfo(taxonomy, record.category);
  const linked = isWork ? findInOrder(data.products, record.relatedProductSlugs ?? []) : findInOrder(data.works, record.relatedWorkSlugs ?? []);
  const related = relatedRecords(record, records, images, photos[0]);
  const inquiry = `/contacts?type=${isWork ? 'custom' : 'product'}&${kind}=${encodeURIComponent(record.slug)}#inquiry`;
  const canBuy = !isWork && record.price && record.inStock !== false;

  return (
    <main id="main" className="container detail-page" tabIndex={-1}>
      <Breadcrumbs trail={[[archiveTitle, archivePath], [record.title]]} />
      <div className={'detail-layout' + (photos.length ? '' : ' detail-layout--text')}>
        <Gallery images={photos} title={record.title} />
        <article className="detail-body">
          {category && <Link className="text-link eyebrow detail-category" to={`${archivePath}?category=${encodeURIComponent(category.id)}`}>{category.title}</Link>}
          <h1>{record.title}</h1>
          {!isWork && <Price price={record.price} oldPrice={record.oldPrice} className="detail-price" />}
          {!isWork && record.price && record.inStock === false && <p className="meta">Немає в наявності</p>}
          <p className="lead">{record.description}</p>
          <Specs record={record} taxonomy={taxonomy} />
          <div className="detail-actions">
            {canBuy && <AddToCart slug={record.slug} title={record.title} />}
            <Link className={'button ' + (canBuy ? 'button--outline' : 'button--primary')} to={inquiry}>
              {isWork ? 'Обговорити подібний виріб' : 'Запитати про виріб'} <Icon name="arrow" />
            </Link>
            {isWork && linked.length > 0 && <Link className="text-link" to={productPath(linked[0].slug)}>Переглянути в каталозі <Icon name="arrow" /></Link>}
            {!isWork && linked.map(work => <Link key={work.slug} className="text-link" to={workPath(work.slug)}>Робота в портфоліо <Icon name="arrow" /></Link>)}
          </div>
        </article>
      </div>
      {related.length > 0 && (
        <section className="detail-section">
          <div className="section-heading"><h2>{isWork ? 'Інші роботи' : 'Схожі вироби'}</h2></div>
          <div className="card-grid">
            {isWork
              ? <WorkResults records={related} taxonomy={taxonomy} images={images} />
              : related.map(item => <ProductCard key={item.slug} record={item} taxonomy={taxonomy} images={images} />)}
          </div>
        </section>
      )}
    </main>
  );
}
