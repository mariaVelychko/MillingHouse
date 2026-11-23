# MillingHouse — інтернет-магазин (диплом)

Node.js + Express + **PostgreSQL** + **Prisma**.

## Запуск
    docker compose up -d          # PostgreSQL у контейнері
    cp .env.example .env          # (Windows: copy .env.example .env)
    npm install
    npx prisma migrate dev --name init   # створює таблиці
    npm run seed                  # демо-товари
    npm start                     # http://localhost:3000

Без Docker: встанови PostgreSQL, створи БД і користувача та впиши DATABASE_URL у `.env`.

## Структура
- `server.js` — застосунок Express
- `prisma/schema.prisma` — схема БД (Category, Product, ProductImage)
- `prisma/seed.js` — наповнення БД; `data/categories.json` — категорії, `data/lamps.json` — 55 ламп з експорту WooCommerce
- `services/fixtures.js` — перетворює дані БД на формат фронтенду (категорії без товарів приховуються)
- `lib/prisma.js` — клієнт Prisma
- `services/catalogService.js` — робота з каталогом
- `routes/api.js` — REST API: `/api/categories`, `/api/products`, `/api/products/:slug`
- `routes/pages.js` — сторінки та чисті адреси: `/`, `/catalog`, `/product/:slug`, `/portfolio`, `/portfolio/:slug`, `/about`, `/contacts`, `/search`; редіректи зі старих `.html`
- `views/` — шаблони EJS: `partials/` (head, sprite, header, footer) і `pages/` (по одному файлу на сторінку)
- `public/` — статика: CSS, шрифти, зображення, скрипти (HTML-сторінок тут уже немає, їх замінили `views/`)

Дані каталогу фронтенд отримує з `/assets/data/fixtures.js`, який генерується з БД.
