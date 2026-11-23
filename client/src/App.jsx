import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Search from './pages/Search.jsx';
import Product from './pages/Product.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Work from './pages/Work.jsx';
import About from './pages/About.jsx';
import Contacts from './pages/Contacts.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderDone from './pages/OrderDone.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="search" element={<Search />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="portfolio/:slug" element={<Work />} />
        <Route path="about" element={<About />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:number" element={<OrderDone />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
