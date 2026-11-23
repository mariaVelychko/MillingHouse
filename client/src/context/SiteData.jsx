import { createContext, useContext, useEffect, useState } from 'react';

const SiteDataContext = createContext(null);

// Один запит до API при старті: товари, категорії, зображення, контент сайту
export function SiteDataProvider({ children, loader }) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    const load = loader ?? (() => fetch('/api/site').then(response => {
      if (!response.ok) throw new Error('API ' + response.status);
      return response.json();
    }));
    load().then(
      data => { if (!cancelled) setState({ status: 'ready', data }); },
      error => { console.error(error); if (!cancelled) setState({ status: 'error', data: null }); },
    );
    return () => { cancelled = true; };
  }, [loader]);

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const value = useContext(SiteDataContext);
  if (!value) throw new Error('useSiteData поза SiteDataProvider');
  return value;
}
