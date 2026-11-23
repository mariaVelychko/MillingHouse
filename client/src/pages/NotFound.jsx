import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { EmptyState } from '../components/Ui.jsx';
import { usePageTitle } from '../lib/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Сторінку не знайдено');
  return (
    <main id="main" className="container" tabIndex={-1}>
      <EmptyState heading="h1" title="Сторінку не знайдено" message="Можливо, адресу введено з помилкою або сторінку переміщено.">
        <Link className="button button--primary" to="/">На головну <Icon name="arrow" /></Link>
      </EmptyState>
    </main>
  );
}
