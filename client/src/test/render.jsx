import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { SiteDataProvider } from '../context/SiteData.jsx';
import { CartProvider } from '../context/Cart.jsx';
import { data } from './fixtures.js';

export function renderApp(path = '/', loader = () => Promise.resolve(data)) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteDataProvider loader={loader}>
        <CartProvider><App /></CartProvider>
      </SiteDataProvider>
    </MemoryRouter>,
  );
}
