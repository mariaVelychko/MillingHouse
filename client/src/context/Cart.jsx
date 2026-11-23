import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const STORAGE_KEY = 'millinghouse-cart';
const MAX_QTY = 99;

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(items)) {
      return items.filter(item => typeof item?.slug === 'string' && Number.isInteger(item.qty) && item.qty > 0)
        .map(item => ({ slug: item.slug, qty: Math.min(item.qty, MAX_QTY) }));
    }
  } catch { /* порожній або пошкоджений кошик */ }
  return [];
}

export function cartReducer(items, action) {
  switch (action.type) {
    case 'add': {
      const qty = action.qty ?? 1;
      const existing = items.find(item => item.slug === action.slug);
      if (!existing) return [...items, { slug: action.slug, qty: Math.min(qty, MAX_QTY) }];
      return items.map(item => item.slug === action.slug ? { ...item, qty: Math.min(item.qty + qty, MAX_QTY) } : item);
    }
    case 'setQty':
      if (action.qty <= 0) return items.filter(item => item.slug !== action.slug);
      return items.map(item => item.slug === action.slug ? { ...item, qty: Math.min(action.qty, MAX_QTY) } : item);
    case 'remove': return items.filter(item => item.slug !== action.slug);
    case 'clear': return [];
    default: return items;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* сховище недоступне */ }
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.qty, 0),
    add: (slug, qty = 1) => dispatch({ type: 'add', slug, qty }),
    setQty: (slug, qty) => dispatch({ type: 'setQty', slug, qty }),
    remove: slug => dispatch({ type: 'remove', slug }),
    clear: () => dispatch({ type: 'clear' }),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart поза CartProvider');
  return value;
}
