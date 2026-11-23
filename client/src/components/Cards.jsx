import { Link } from 'react-router-dom';
import { categoryInfo, recordImages, resolveImage } from '../lib/data.js';
import { sizeText } from '../lib/format.js';
import { Icon } from './Icon.jsx';
import Media from './Media.jsx';
import { Price } from './Ui.jsx';
import AddToCart from './AddToCart.jsx';

export const productPath = slug => '/product/' + encodeURIComponent(slug);
export const workPath = slug => '/portfolio/' + encodeURIComponent(slug);

export function ProductCard({ record, taxonomy, images }) {
  const category = categoryInfo(taxonomy, record.category);
  const image = recordImages(record, images)[0];
  const specs = [category?.title, sizeText(record)].filter(Boolean);
  const cover = image?.card ? { ...image, ...image.card } : image;
  return (
    <article className={'card' + (image ? '' : ' card--text')}>
      <Link className="card__link" to={productPath(record.slug)}>
        {image && (
          <div className="card__image" style={{ '--card-ratio': cover.width / cover.height }}>
            <Media image={cover} sizes="(max-width: 900px) 46vw, 26vw" />
          </div>
        )}
        <div className="card__body">
          <p className="meta card__spec">{specs.join(' · ')}</p>
          <h3 className="card__title">{record.title}</h3>
          {!image && <p className="card__description">{record.description}</p>}
          <div className="card__footer">
            <Price price={record.price} oldPrice={record.oldPrice} />
            <span className="sr-only">Переглянути товар</span>
            <span className="card__action"><Icon name="arrow" /></span>
          </div>
        </div>
      </Link>
      {record.price && record.inStock !== false && (
        <div className="card__cart"><AddToCart slug={record.slug} title={record.title} className="button button--outline" /></div>
      )}
    </article>
  );
}

function WorkCard({ record, taxonomy, image, heading: Heading = 'h3' }) {
  const category = categoryInfo(taxonomy, record.category);
  const specs = [category?.title, taxonomy.materials?.[record.material]].filter(Boolean);
  return (
    <article className={'work-card' + (image ? '' : ' work-card--text')}>
      <Link className="work-card__link" to={workPath(record.slug)}>
        {image && <div className="work-card__image"><Media image={image} sizes="(max-width: 900px) 46vw, 34vw" /></div>}
        <div className="work-card__body">
          <p className="meta">{specs.join(' · ')}</p>
          <Heading>{record.title}</Heading>
          {!image && <p className="card__description">{record.description}</p>}
          <span className="work-card__arrow"><span className="sr-only">Переглянути роботу</span><Icon name="arrow" /></span>
        </div>
      </Link>
    </article>
  );
}

// Роботи з фото йдуть галереєю, текстові — списком «Більше робіт»
export function WorkResults({ records, taxonomy, images }) {
  const shown = new Set();
  const entries = records.map(record => {
    const image = recordImages(record, images)[0];
    const cover = image?.status === 'demo' && shown.has(image.src) ? null : image;
    if (cover) shown.add(cover.src);
    return { record, cover };
  });
  const render = (items, heading) => items.map(({ record, cover }) =>
    <WorkCard key={record.slug} record={record} taxonomy={taxonomy} image={cover} heading={heading} />);
  const firstText = entries.findIndex(({ cover }) => !cover);

  if (firstText === -1) return <>{render(entries)}</>;
  const tail = entries.slice(firstText);
  if (firstText === 1 || tail.some(({ cover }) => cover)) return <div className="work-results-list">{render(entries)}</div>;
  return (
    <>
      {render(entries.slice(0, firstText))}
      <div className="work-index">
        {firstText > 0 && <h3 className="work-index__title">Більше робіт</h3>}
        <div className="work-index__list">{render(tail, firstText ? 'h4' : 'h3')}</div>
      </div>
    </>
  );
}

export function CategoryCard({ category, images }) {
  const image = resolveImage(images, category.editorialImage ?? category.image);
  return (
    <Link className="category-card" to={'/catalog?category=' + encodeURIComponent(category.id)}>
      {image && <div className="category-card__image"><Media image={image} sizes="(max-width: 720px) 27vw, 25vw" /></div>}
      <div className="category-card__body"><h3>{category.title}</h3><Icon name="arrow" /></div>
    </Link>
  );
}

export function MosaicCard({ record, taxonomy, images, lead = false }) {
  const category = categoryInfo(taxonomy, record.category);
  const [full, detail] = recordImages(record, images);
  const image = detail ?? full;
  return (
    <Link className={'mosaic-card' + (lead ? ' mosaic-card--lead' : '') + (image ? '' : ' mosaic-card--text')} to={workPath(record.slug)}>
      {image && <div className="mosaic-card__media">
        <Media image={image} sizes={lead ? '(max-width: 850px) 94vw, 56vw' : '(max-width: 850px) 46vw, 22vw'} /></div>}
      <div className="mosaic-card__body">
        <p className="meta">{category?.title}</p>
        <h3>{record.title}</h3>
        {lead && <p className="mosaic-card__description">{record.description}</p>}
        <Icon name="arrow" />
      </div>
    </Link>
  );
}
