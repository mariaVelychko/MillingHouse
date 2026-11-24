// Вхід в адмінку без сторонніх бібліотек: підписаний HttpOnly-cookie з терміном дії.
const crypto = require('crypto');

const COOKIE = 'mh_admin';
const TTL_MS = 8 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const hmac = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
// Порівняння без витоку часу: хешуємо обидва значення до однакової довжини
const safeEqual = (a, b) => {
  const hash = value => crypto.createHash('sha256').update(String(value)).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
};

function createToken(secret, now = Date.now()) {
  const expires = String(now + TTL_MS);
  return expires + '.' + hmac(expires, secret);
}

function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  return safeEqual(signature, hmac(expires, secret)) && Number(expires) > now;
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function createAdminAuth({ login, password, secret = crypto.randomBytes(32).toString('hex'), secure = false, now = () => Date.now() } = {}) {
  const enabled = Boolean(login && password);
  const fails = new Map(); // ip -> { count, until }

  const cookie = (value, maxAge) =>
    `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  const isAdmin = req => verifyToken(parseCookies(req.headers.cookie)[COOKIE], secret, now());

  return {
    enabled,
    isAdmin,

    requireAdmin(req, res, next) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Потрібен вхід' });
      // Захист від CSRF для змін: якщо браузер надіслав Origin, він має збігатися з хостом
      const origin = req.headers.origin;
      if (req.method !== 'GET' && origin && new URL(origin).host !== req.headers.host) {
        return res.status(403).json({ error: 'Заборонено' });
      }
      next();
    },

    login(req, res) {
      if (!enabled) return res.status(503).json({ error: 'Адмінку не налаштовано (ADMIN_LOGIN і ADMIN_PASSWORD у .env)' });
      const ip = req.ip;
      const state = fails.get(ip);
      if (state && state.count >= MAX_FAILS && state.until > now()) {
        return res.status(429).json({ error: 'Забагато спроб. Спробуйте за 15 хвилин.' });
      }
      const { login: l, password: p } = req.body ?? {};
      // Обидві перевірки виконуються завжди, щоб не показувати, що саме невірне
      const okLogin = safeEqual(l ?? '', login);
      const okPassword = safeEqual(p ?? '', password);
      if (!(okLogin && okPassword)) {
        fails.set(ip, { count: (state?.until > now() ? state.count : 0) + 1, until: now() + LOCK_MS });
        return res.status(401).json({ error: 'Невірний логін або пароль' });
      }
      fails.delete(ip);
      res.setHeader('Set-Cookie', cookie(createToken(secret, now()), TTL_MS / 1000));
      res.json({ ok: true });
    },

    logout(req, res) {
      res.setHeader('Set-Cookie', cookie('', 0));
      res.json({ ok: true });
    },

    me(req, res) {
      res.json({ admin: isAdmin(req), configured: enabled });
    },
  };
}

module.exports = { createAdminAuth, createToken, verifyToken, parseCookies, COOKIE };
