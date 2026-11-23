import { useEffect, useState } from 'react';
import { useCart } from '../context/Cart.jsx';

export default function AddToCart({ slug, title, className = 'button button--primary' }) {
  const { add, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = items.find(item => item.slug === slug)?.qty ?? 0;

  useEffect(() => {
    if (!justAdded) return undefined;
    const timer = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [justAdded]);

  return (
    <>
      <button type="button" className={className} aria-label={'Додати в кошик: ' + title}
        onClick={() => { add(slug); setJustAdded(true); }}>
        {justAdded ? 'Додано ✓' : 'Додати в кошик'}
      </button>
      <span className="sr-only" role="status">{justAdded ? title + ' додано в кошик. У кошику: ' + inCart : ''}</span>
    </>
  );
}
