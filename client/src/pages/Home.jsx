import { Link } from 'react-router-dom';
import { findInOrder, resolveImage } from '../lib/data.js';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon, LineIcon } from '../components/Icon.jsx';
import Media from '../components/Media.jsx';
import { CategoryCard, MosaicCard, ProductCard } from '../components/Cards.jsx';
import { LoadError } from '../components/Ui.jsx';

const paths = [
  ['/catalog', 'Каталог', 'Моделі, форми та розміри'],
  ['/portfolio', 'Портфоліо', 'Композиції та деталі різьблення'],
  ['/contacts?type=custom#inquiry', 'На замовлення', 'Виріб за вашим задумом'],
];

export default function Home() {
  usePageTitle('');
  const { status, data } = useSiteData();
  const ready = status === 'ready';
  const { taxonomy, media: images, site } = data ?? {};
  const works = ready ? findInOrder(data.works, site.featuredWorkSlugs) : [];
  const selection = ready ? findInOrder(data.products, site.selectedProductSlugs) : [];

  return (
    <main id="main" tabIndex={-1}>
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="container home-hero__layout">
          <div className="home-hero__content">
            <p className="eyebrow">Вироби з натурального дерева</p>
            <h1 id="hero-title">Дерев’яні вироби <span>з характером</span></h1>
            <p className="lead">Лампи, різьблені панно, іграшки та церковні вироби. Розробляємо власні моделі й працюємо на верстатах із ЧПК.</p>
            <div className="button-row">
              <Link className="button button--primary" to="/catalog">Перейти в каталог <Icon name="arrow" /></Link>
              <Link className="button button--outline" to="/about">Про виробництво</Link>
            </div>
          </div>
        </div>
        <div className="home-hero__figure">{ready && <Media image={resolveImage(images, site.heroImage)} eager sizes="(max-width: 700px) 100vw, 72vw" />}</div>
      </section>

      <nav className="home-paths" aria-label="Почати перегляд">
        <div className="container home-paths__grid">
          {paths.map(([to, title, text]) => (
            <Link key={to} className="path-link" to={to}><span><strong>{title}</strong><small>{text}</small></span><Icon name="arrow" /></Link>
          ))}
        </div>
      </nav>

      <section className="section container home-categories" aria-labelledby="categories-title">
        <div className="home-categories__intro">
          <p className="eyebrow">Наші категорії</p>
          <h2 id="categories-title"><span>Вироби</span> <span>для дому</span> <span>і приватних</span> <span>інтер’єрів</span></h2>
        </div>
        <div className="category-grid" aria-live="polite">
          {ready ? taxonomy.categories.map(category => <CategoryCard key={category.id} category={category} images={images} />)
            : status === 'error' && <LoadError />}
        </div>
      </section>

      {works.length > 0 && (
        <section className="section home-featured" aria-labelledby="featured-title">
          <div className="container">
            <div className="section-heading">
              <h2 id="featured-title">Вибрані роботи</h2>
              <Link className="text-link" to="/portfolio">Переглянути портфоліо <Icon name="arrow" /></Link>
            </div>
            <div className="work-mosaic">
              {works.map((work, index) => <MosaicCard key={work.slug} record={work} taxonomy={taxonomy} images={images} lead={index === 0} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section production-section" aria-labelledby="production-title">
        <div className="production-panel__figure">{ready && <Media image={resolveImage(images, site.productionImage)} sizes="(max-width: 700px) 100vw, 70vw" />}</div>
        <div className="container production-panel">
          <div className="production-panel__body">
            <p className="eyebrow">Від ідеї до готового виробу</p>
            <h2 id="production-title"><Link to="/about">Власне виробництво</Link></h2>
            <p>Розробляємо цифрові моделі, переносимо форму в дерево на верстатах із ЧПК і доводимо деталі під час оздоблення.</p>
            <ul className="production-steps" aria-label="Етапи роботи">
              <li><LineIcon name="model" />3D-моделювання</li>
              <li><LineIcon name="cnc" />Різьблення на ЧПК</li>
              <li><LineIcon name="layers" />Оздоблення й огляд</li>
            </ul>
          </div>
          <div className="production-panel__inset">{ready && <Media image={resolveImage(images, site.productionInset)} sizes="(max-width: 700px) 50vw, 31vw" />}</div>
        </div>
      </section>

      {selection.length > 0 && (
        <section className="section container home-selection" aria-labelledby="selection-title">
          <div className="section-heading">
            <h2 id="selection-title">Вибрані вироби</h2>
            <Link className="text-link" to="/catalog">Весь каталог <Icon name="arrow" /></Link>
          </div>
          <div className="card-grid home-product-grid">
            {selection.map(product => <ProductCard key={product.slug} record={product} taxonomy={taxonomy} images={images} />)}
          </div>
        </section>
      )}

      <section className="custom-band custom-band--editorial" aria-labelledby="custom-title">
        <div className="container custom-band__inner">
          <div className="custom-band__body">
            <h2 id="custom-title">Маєте задум для свого виробу?</h2>
            <p>Розкажіть про бажані розміри, форму або сюжет різьблення. Обговоримо модель і виготовлення.</p>
            <Link className="button button--primary" to="/contacts?type=custom#inquiry">Обговорити задум <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
