import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function EmptyState({ title, message, children, heading = 'h2' }) {
  const Heading = heading;
  return (
    <div className="empty-state">
      <Heading>{title}</Heading>
      <p>{message}</p>
      {children}
    </div>
  );
}

export function Breadcrumbs({ trail }) {
  return (
    <nav className="breadcrumbs" aria-label="Навігаційний шлях">
      <ol>
        <li><Link to="/">Головна</Link></li>
        {trail.map(([label, to], index) => index === trail.length - 1 || !to
          ? <li key={label} aria-current="page">{label}</li>
          : <li key={label}><Link to={to}>{label}</Link></li>)}
      </ol>
    </nav>
  );
}

export function LoadError() {
  return <EmptyState title="Не вдалося відкрити розділ" message="Спробуйте оновити сторінку." />;
}

export function LinkArrow({ to, children, className = 'text-link' }) {
  return <Link className={className} to={to}>{children} <Icon name="arrow" /></Link>;
}

export function Price({ price, oldPrice, className = 'card__price' }) {
  if (!price) return <span className={className + ' meta'}>Ціну уточнюйте</span>;
  return (
    <span className={className}>
      {oldPrice && <s className="price-old">{formatInline(oldPrice)}</s>}
      <span className="price-current">{formatInline(price)}</span>
    </span>
  );
}

import { formatPrice } from '../lib/format.js';
const formatInline = price => formatPrice(price);
