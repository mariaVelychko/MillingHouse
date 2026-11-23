import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteData } from '../context/SiteData.jsx';
import { itemForms, pluralCount, relevance } from '../lib/format.js';
import { usePageTitle } from '../lib/usePageTitle.js';
import { Icon } from '../components/Icon.jsx';
import { Breadcrumbs, EmptyState, LoadError } from '../components/Ui.jsx';
import { ProductCard, WorkResults } from '../components/Cards.jsx';

export default function Search() {
  usePageTitle('Пошук');
  const [params, setParams] = useSearchParams();
  const term = (params.get('q') ?? '').trim().slice(0, 120);
  const [input, setInput] = useState(term);
  useEffect(() => setInput(term), [term]);
  const { status, data } = useSiteData();

  let body = null;
  let summary = 'Введіть назву виробу, категорію або сюжет різьблення.';
  if (term && status === 'error') { summary = ''; body = <LoadError />; }
  else if (term && status === 'ready') {
    const groups = [
      { records: data.products, kind: 'product', label: 'Каталог', archive: '/catalog' },
      { records: data.works, kind: 'work', label: 'Портфоліо', archive: '/portfolio' },
    ].map(group => ({
      ...group,
      matches: group.records.map(record => ({ record, score: relevance(record, term, data.taxonomy) }))
        .filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score).map(({ record }) => record),
    }));
    const total = groups.reduce((sum, group) => sum + group.matches.length, 0);
    summary = `«${term}» · ${pluralCount(total, itemForms.match)}`;
    body = total ? groups.filter(group => group.matches.length).map(({ kind, label, archive, matches }) => (
      <section className="search-group" key={kind}>
        <div className="section-heading">
          <div><h2>{label}</h2><p className="meta">{pluralCount(matches.length, itemForms[kind])}</p></div>
          <Link className="text-link" to={`${archive}?q=${encodeURIComponent(term)}`}>Усі збіги <Icon name="arrow" /></Link>
        </div>
        <div className="card-grid">
          {kind === 'work'
            ? <WorkResults records={matches.slice(0, 6)} taxonomy={data.taxonomy} images={data.media} />
            : matches.slice(0, 6).map(record => <ProductCard key={record.slug} record={record} taxonomy={data.taxonomy} images={data.media} />)}
        </div>
      </section>
    )) : <EmptyState title="Нічого не знайдено" message="Перевірте написання або спробуйте коротший запит." />;
  } else if (term) summary = '';

  return (
    <main id="main" className="container search-page" tabIndex={-1}>
      <Breadcrumbs trail={[['Пошук']]} />
      <div className="page-intro">
        <h1>Пошук по сайту</h1>
        <p className="lead">Знайдіть виріб у каталозі або роботу в портфоліо.</p>
      </div>
      <form className="search-bar" role="search" aria-label="Пошук по сайту"
        onSubmit={event => { event.preventDefault(); setParams(input.trim() ? { q: input.trim() } : {}); }}>
        <label className="sr-only" htmlFor="global-query">Назва виробу або роботи</label>
        <Icon name="search" />
        <input type="search" id="global-query" name="q" maxLength={120} placeholder="Наприклад, «зірка»" value={input}
          onChange={event => setInput(event.target.value)} />
        <button className="button button--primary" type="submit">Знайти</button>
      </form>
      <p className="search-status meta" role="status">{summary}</p>
      <div>{body}</div>
    </main>
  );
}
