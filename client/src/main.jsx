import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SiteDataProvider } from './context/SiteData.jsx';
import { CartProvider } from './context/Cart.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SiteDataProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SiteDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
