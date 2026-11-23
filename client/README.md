# MillingHouse — клієнт (React)

Vite + React + React Router. Дані приходять з `GET /api/site` (Express + PostgreSQL), стилі й зображення — зі `src/public/assets`.

## Запуск для розробки (дві консолі)
1. `cd src && npm start` — API на http://localhost:3000
2. `cd client && npm install && npm run dev` — сайт на http://localhost:5173 (проксі на API)

## Продакшн-збірка (один сервер)
1. `cd client && npm install && npm run build`
2. `cd ../src && npm start` — Express віддає `client/dist` і API на http://localhost:3000

## Тести
`cd client && npm test` · `cd src && npm test`
