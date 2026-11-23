import { Link } from 'react-router-dom';
import { resolveImage } from '../lib/data.js';
import { useSiteData } from '../context/SiteData.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon, LineIcon } from '../components/Icon.jsx';
import { FigureImage } from '../components/Media.jsx';
import { PhotoGrid } from '../components/Gallery.jsx';
import { Breadcrumbs } from '../components/Ui.jsx';

const steps = [
  ['model', 'Моделювання', 'Визначають форму, пропорції та глибину рельєфу.'],
  ['wood', 'Підготовка деревини', 'Добирають заготовку з урахуванням її розміру й напряму волокон.'],
  ['cnc', 'Різьблення на ЧПК', 'Переносять контури та об’єм цифрової моделі в дерево.'],
  ['layers', 'Оздоблення й огляд', 'Обробляють поверхню й перевіряють деталі готового виробу.'],
];

export default function About() {
  usePageTitle('Про нас');
  const { status, data } = useSiteData();
  const site = data?.site;
  const hero = status === 'ready' ? resolveImage(data.media, site.aboutImage ?? site.productionImage) : null;
  const details = status === 'ready' ? (site.aboutImageIds ?? []).map(id => resolveImage(data.media, id)).filter(Boolean) : [];
  return (
    <main id="main" tabIndex={-1}>
      <div className="container">
        <Breadcrumbs trail={[['Про нас']]} />
        <section className="about-hero" aria-labelledby="about-title">
          <h1 id="about-title">Власне виробництво</h1>
          <div className="about-hero__body">
            <p className="lead">Виготовляємо вироби з натурального дерева. Частину моделей розробляємо самостійно й втілюємо на власних верстатах із ЧПК.</p>
            <a className="text-link" href="#process">Як виготовляємо вироби <Icon name="down" /></a>
          </div>
          <figure className="about-hero__figure"><FigureImage image={hero} eager sizes="91vw" /></figure>
        </section>
      </div>

      <section className="container about-capabilities" aria-labelledby="capabilities-title">
        <h2 id="capabilities-title">Можливості виробництва</h2>
        <div className="editorial-columns">
          <article><h3>Розробка моделей</h3><p>Під час моделювання працюємо із силуетом, пропорціями й глибиною рельєфу. Ці рішення визначають, як читається композиція в дереві.</p></article>
          <article><h3>Деревообробка на ЧПК</h3><p>Власне обладнання з числовим програмним керуванням дає змогу працювати з різними формами, від простих контурів до багатофігурних панно.</p></article>
        </div>
      </section>

      <section id="process" className="section section--sand about-process" aria-labelledby="process-title">
        <div className="container">
          <div className="section-heading">
            <div><h2 id="process-title">Від ескізу до готового виробу</h2><p>Типова послідовність виготовлення різьбленого виробу.</p></div>
            <Link className="text-link" to="/portfolio">Переглянути роботи <Icon name="arrow" /></Link>
          </div>
          <div className="about-process__layout">
            <ol className="process-grid">
              {steps.map(([icon, title, text]) => <li key={title}><LineIcon name={icon} /><div><h3>{title}</h3><p>{text}</p></div></li>)}
            </ol>
            <div><div className="about-images"><PhotoGrid images={details} title="Етапи роботи з деревом" /></div></div>
          </div>
        </div>
      </section>

      <section className="custom-band custom-band--editorial" aria-labelledby="about-custom-title">
        <div className="container custom-band__inner">
          <div className="custom-band__body">
            <h2 id="about-custom-title">Маєте задум для свого виробу?</h2>
            <p>Розкажіть про бажані розміри, форму або сюжет різьблення.</p>
            <Link className="button button--primary" to="/contacts?type=custom#inquiry">Обговорити задум <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
