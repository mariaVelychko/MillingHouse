import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { archiveOptions, hasFilters, matchingRecords, priceBound, readState, toSearchParams } from '../lib/archive.js';
import { itemForms, pluralCount } from '../lib/format.js';
import { Icon, LineIcon } from './Icon.jsx';
import { EmptyState } from './Ui.jsx';
import { ProductCard, WorkResults } from './Cards.jsx';

const emptyState = (options, state) => ({ ...readState(new URLSearchParams(), options), archive: state.archive, view: state.view });

function Facets({ options, selection, onToggle, prefix }) {
  return options.facets.map(({ key, label, options: items }) => (
    <details className="filter-section" open key={key}>
      <summary>{label}</summary>
      <fieldset className="filter-group">
        <legend className="sr-only">{label}</legend>
        {items.map(option => (
          <label key={option.id}>
            <input type="checkbox" name={key} value={option.id} id={`${prefix}-${key}-${option.id}`}
              checked={selection.filters[key]?.includes(option.id) ?? false}
              onChange={event => onToggle(key, option.id, event.target.checked)} />
            <span>{option.label} <span className="filter-count">({option.count})</span></span>
          </label>
        ))}
      </fieldset>
    </details>
  ));
}

function PriceFields({ value, onChange }) {
  const reversed = value.minPrice !== '' && value.maxPrice !== '' && Number(value.minPrice) > Number(value.maxPrice);
  return (
    <details className="filter-section" open>
      <summary>Ціна, грн</summary>
      <fieldset className="filter-group">
        <legend className="sr-only">Ціна, грн</legend>
        <div className="price-fields">
          <label>Від <input type="number" name="minPrice" min="0" step="any" inputMode="decimal" value={value.minPrice}
            onChange={event => onChange({ ...value, minPrice: event.target.value })} /></label>
          <label>До <input type="number" name="maxPrice" min="0" step="any" inputMode="decimal" value={value.maxPrice}
            aria-invalid={reversed || undefined}
            onChange={event => onChange({ ...value, maxPrice: event.target.value })} /></label>
        </div>
        {reversed && <p className="meta" role="alert">Верхня межа має бути не меншою за нижню.</p>}
      </fieldset>
    </details>
  );
}

const priceDraft = state => ({ minPrice: state.minPrice ?? '', maxPrice: state.maxPrice ?? '' });
const priceValues = draft => ({ minPrice: priceBound(draft.minPrice), maxPrice: priceBound(draft.maxPrice) });
const priceValid = draft => {
  const { minPrice, maxPrice } = priceValues(draft);
  return minPrice === null || maxPrice === null || minPrice <= maxPrice;
};

function toggle(filters, key, id, on) {
  const current = filters[key] ?? [];
  return { ...filters, [key]: on ? [...new Set([...current, id])] : current.filter(value => value !== id) };
}

function CategoryNav({ records, state, options, kind, go }) {
  const selected = state.filters.category ?? [];
  const links = [{ id: '', icon: 'crucifix', title: kind === 'work' ? 'Усі роботи' : 'Усі вироби', count: records.length },
    ...options.categories.map(category => ({ ...category, count: records.filter(record => record.category === category.id).length }))];
  return (
    <nav id="archive-categories" className="container category-nav" aria-label={kind === 'work' ? 'Категорії робіт' : 'Категорії виробів'}>
      {links.map(({ id, icon, title, count }) => {
        const active = id ? selected.length === 1 && selected[0] === id : selected.length === 0;
        return (
          <Link key={id || 'all'} data-category={id} aria-current={active ? 'true' : undefined}
            to={'?' + toSearchParams({ ...state, filters: { ...state.filters, category: id ? [id] : [] }, page: 1 })}
            onClick={event => { event.preventDefault(); go({ ...state, filters: { ...state.filters, category: id ? [id] : [] }, page: 1 }); }}>
            {icon && (id || kind === 'product') && <LineIcon name={icon} />}
            <span className="category-nav__label">{title}
              {kind === 'product' && <small className="category-nav__count">{pluralCount(count, itemForms.model)}</small>}
            </span>
          </Link>
        );
      })}
      {kind === 'work' && <a className="category-nav__custom" href="#project-inquiry"><LineIcon name="star" /><span className="category-nav__label">Індивідуальні проєкти</span></a>}
    </nav>
  );
}

function Chips({ state, options, go, clear }) {
  const items = [];
  const chip = (key, label, value = '') => items.push(
    <li key={key + value}>
      <button type="button" aria-label={'Прибрати: ' + label} onClick={() => {
        if (key === 'q') go({ ...state, q: '', page: 1 });
        else if (key === 'price') go({ ...state, minPrice: null, maxPrice: null, page: 1 });
        else go({ ...state, filters: { ...state.filters, [key]: state.filters[key].filter(id => id !== value) }, page: 1 });
      }}>{label}<Icon name="close" /></button>
    </li>);
  if (state.q) chip('q', '«' + state.q + '»');
  for (const { key, options: list } of options.facets) {
    for (const option of list) if (state.filters[key].includes(option.id)) chip(key, option.label, option.id);
  }
  if (state.minPrice !== null || state.maxPrice !== null) {
    const bounds = [];
    if (state.minPrice !== null) bounds.push('від ' + state.minPrice);
    if (state.maxPrice !== null) bounds.push('до ' + state.maxPrice);
    chip('price', bounds.join(' ') + ' грн');
  }
  if (!items.length) return null;
  items.push(<li key="all"><button className="filter-reset" type="button" onClick={clear}>Скинути все</button></li>);
  return <ul className="filter-chips" aria-label="Вибрані фільтри">{items}</ul>;
}

function Pagination({ state, total, go }) {
  if (total < 2) return null;
  const pages = [...new Set([1, total, state.page - 1, state.page, state.page + 1].filter(page => page >= 1 && page <= total))].sort((a, b) => a - b);
  const link = (page, label, content) => (
    <Link key={label} to={'?' + toSearchParams({ ...state, page })} aria-label={label} aria-current={page === state.page ? 'page' : undefined}
      onClick={event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); go({ ...state, page }, true);
      }}>{content}</Link>);
  const out = [];
  if (state.page > 1) out.push(link(state.page - 1, 'Попередня сторінка', <Icon name="arrow icon-back" />));
  let previous = 0;
  for (const page of pages) {
    if (page - previous > 1) out.push(<span key={'gap' + page} aria-hidden="true">…</span>);
    out.push(link(page, 'Сторінка ' + page, page));
    previous = page;
  }
  if (state.page < total) out.push(link(state.page + 1, 'Наступна сторінка', <Icon name="arrow" />));
  return <nav className="pagination" aria-label="Сторінки">{out}</nav>;
}

function MobileFilters({ options, state, records, taxonomy, kind, dialogRef, onApply, clearState }) {
  const [draft, setDraft] = useState(state);
  const [price, setPrice] = useState(priceDraft(state));
  // Щоразу при відкритті діалогу чернетка береться з поточного стану
  useEffect(() => { setDraft(state); setPrice(priceDraft(state)); }, [state]);
  const valid = !options.hasPrice || priceValid(price);
  const preview = valid ? { ...draft, ...(options.hasPrice ? priceValues(price) : {}), page: 1 } : null;
  const count = preview ? matchingRecords(records, preview, taxonomy).length : null;
  const close = () => dialogRef.current?.close();
  return (
    <dialog id="filter-dialog" className="drawer drawer--filters" aria-labelledby="filter-title" ref={dialogRef}
      onClick={event => { if (event.target === dialogRef.current) close(); }}>
      <div className="drawer__header">
        <h2 id="filter-title">{kind === 'work' ? 'Фільтри портфоліо' : 'Фільтри каталогу'}</h2>
        <button className="icon-button" type="button" autoFocus aria-label="Закрити фільтри" onClick={close}><Icon name="close" /></button>
      </div>
      <div className="drawer__body">
        <form className="mobile-filter-form" onSubmit={event => { event.preventDefault(); if (preview) { onApply({ ...preview, archive: kind === 'work' || preview.archive }); close(); } }}>
          <div className="mobile-filter-form__fields">
            <Facets options={options} selection={draft} prefix="m"
              onToggle={(key, id, on) => setDraft({ ...draft, filters: toggle(draft.filters, key, id, on) })} />
            {options.hasPrice && <PriceFields value={price} onChange={setPrice} />}
          </div>
          <div className="mobile-filter-form__actions">
            <button className="filter-reset" type="button" onClick={() => { const cleared = clearState(); setDraft(cleared); setPrice(priceDraft(cleared)); }}>Скинути</button>
            <button className="button button--primary" type="submit" disabled={!valid}>
              {count === null ? 'Перевірте діапазон' : 'Показати ' + pluralCount(count, itemForms[kind])}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// Спільна сторінка списку: каталог (kind=product) і портфоліо (kind=work).
// Весь стан фільтрів зберігається в адресі, тому посилання можна ділитися.
export default function Archive({ kind, records, taxonomy, images, pageSize, hasFeature = false, feature = null }) {
  const [params, setParams] = useSearchParams();
  const options = useMemo(() => archiveOptions(records, taxonomy, kind), [records, taxonomy, kind]);
  const state = useMemo(() => readState(params, options), [params, options]);
  const results = useMemo(() => matchingRecords(records, state, taxonomy), [records, state, taxonomy]);
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(state.page, pageCount);
  const heading = useRef(null);
  const dialog = useRef(null);
  const [query, setQuery] = useState(state.q);
  const [price, setPrice] = useState(priceDraft(state));
  useEffect(() => setQuery(state.q), [state.q]);
  useEffect(() => setPrice(priceDraft(state)), [state.minPrice, state.maxPrice]);

  const portfolio = kind === 'work';
  const go = (next, focus = false) => {
    setParams(toSearchParams(next));
    if (focus) requestAnimationFrame(() => heading.current?.focus());
  };
  const clear = () => go(emptyState(options, state), true);
  const changed = Boolean(state.q) || hasFilters(state);
  const canReset = changed || state.sort !== 'default';
  const showFeature = hasFeature && !canReset && !state.archive && page === 1;
  const visible = results.slice((page - 1) * pageSize, page * pageSize);
  const current = { ...state, page };

  const sidebar = (
    <aside id="desktop-filters" className="filter-sidebar" aria-label={portfolio ? 'Фільтри портфоліо' : 'Фільтри каталогу'}>
      <div className="filter-sidebar__head">
        <h2>Фільтри</h2>
        <button className="filter-reset" type="button" disabled={!canReset} onClick={clear}>Очистити все</button>
      </div>
      <Facets options={options} selection={state} prefix="d"
        onToggle={(key, id, on) => go({ ...state, filters: toggle(state.filters, key, id, on), page: 1 })} />
      {options.hasPrice && (
        <form className="price-form" onSubmit={event => { event.preventDefault(); if (priceValid(price)) go({ ...state, ...priceValues(price), page: 1 }); }}>
          <PriceFields value={price} onChange={setPrice} />
          <button type="submit" className="button button--primary" disabled={!priceValid(price)}><Icon name="filter" />Застосувати фільтри</button>
        </form>
      )}
    </aside>
  );

  const searchForm = (
    <form className="search-bar search-bar--compact" role="search" aria-label={portfolio ? 'Пошук у портфоліо' : 'Пошук у каталозі'}
      onSubmit={event => { event.preventDefault(); go({ ...state, q: query.trim(), archive: portfolio && (state.archive || Boolean(query.trim())), page: 1 }); }}>
      <label className="sr-only" htmlFor="archive-query">{portfolio ? 'Назва, сюжет або тип роботи' : 'Назва виробу'}</label>
      <input type="search" id="archive-query" name="q" maxLength={120} placeholder={portfolio ? 'Назва або сюжет' : 'Назва виробу'}
        value={query} onChange={event => setQuery(event.target.value)} />
      <button className="icon-button" type="submit" aria-label={portfolio ? 'Знайти роботу' : 'Знайти виріб'}><Icon name="search" /></button>
    </form>
  );
  const filterButton = (
    <button className="button button--outline filter-toggle" type="button" aria-haspopup="dialog" aria-controls="filter-dialog"
      onClick={() => dialog.current?.showModal?.()}><Icon name="filter" /> Фільтри</button>
  );

  return (
    <>
      <CategoryNav records={records} state={current} options={options} kind={kind} go={go} />
      {portfolio && (
        <div className="container portfolio-search">{searchForm}{filterButton}</div>
      )}
      {showFeature && feature}
      <div className="container archive-layout" hidden={showFeature || undefined}>
        {sidebar}
        <section id="archive-results" className="archive-results" aria-labelledby="results-heading">
          <div className="results-heading">
            <div>
              <h2 id="results-heading" tabIndex={-1} ref={heading}>{changed ? 'Результати' : portfolio ? 'Усі роботи' : 'Усі вироби'}</h2>
              <p className="meta" role="status">Знайдено {pluralCount(results.length, itemForms[kind])}</p>
            </div>
            <div className="results-controls">
              {!portfolio && searchForm}
              {!portfolio && filterButton}
              <div className="sort-control">
                <label className={portfolio ? 'sr-only' : undefined} htmlFor="archive-sort">Сортувати</label>
                <select id="archive-sort" value={state.sort} onChange={event => go({ ...state, sort: event.target.value, page: 1 })}>
                  {options.sort.map(([value, title]) => (
                    <option key={value} value={value}>{value === 'default' && state.q ? 'За релевантністю' : title}</option>
                  ))}
                </select>
              </div>
              {!portfolio && (
                <div className="view-switch" role="group" aria-label="Вигляд каталогу">
                  {['grid', 'list'].map(view => (
                    <button key={view} className="icon-button" type="button" aria-label={view === 'grid' ? 'Сітка' : 'Список'}
                      aria-pressed={state.view === view} onClick={() => go({ ...state, view })}><LineIcon name={view} /></button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Chips state={current} options={options} go={go} clear={clear} />
          <div className={'card-grid' + (state.view === 'list' ? ' card-grid--list' : '')}>
            {!visible.length
              ? <EmptyState title="Нічого не знайдено" message="Спробуйте іншу назву або змініть фільтри.">
                  <button className="button button--outline" type="button" onClick={clear}>Скинути пошук і фільтри</button>
                </EmptyState>
              : portfolio
                ? <WorkResults records={visible} taxonomy={taxonomy} images={images} />
                : visible.map(record => <ProductCard key={record.slug} record={record} taxonomy={taxonomy} images={images} />)}
          </div>
          <Pagination state={current} total={pageCount} go={go} />
        </section>
      </div>
      <MobileFilters options={options} state={state} records={records} taxonomy={taxonomy} kind={kind} dialogRef={dialog}
        onApply={next => go(next)} clearState={() => emptyState(options, state)} />
    </>
  );
}
