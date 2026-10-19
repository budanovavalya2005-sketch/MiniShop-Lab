const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const app = express();
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
const sessions = new Map();
const demoAccount = {
  email: 'student@example.test',
  password: 'MiniShop-Lab-Only-42!'
};
let currentMode = 'safe';

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '16kb', strict: true }));

function cookieValue(req, name) {
  const entry = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

function requireSession(req, res, next) {
  const sessionId = cookieValue(req, 'minishop_session');
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.session = sessions.get(sessionId);
  return next();
}

app.get('/api/config', (req, res) => {
  res.json({
    appName: 'MiniShop Lab',
    mode: currentMode,
    availableModes: ['safe', 'training'],
    apiVersion: 1,
    localOnly: true,
    demoCredentialsExposed: false
  });
});

app.post('/api/mode', (req, res) => {
  const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (!isLoopback) return res.status(403).json({ error: 'This lab is local-only.' });
  const { mode } = req.body || {};
  if (!['safe', 'training'].includes(mode)) {
    return res.status(400).json({ error: 'Choose safe or training mode.' });
  }
  currentMode = mode;
  return res.json({ mode: currentMode });
});

app.get('/api/products', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (currentMode === 'safe' && query.length > 80) {
    return res.status(400).json({ error: 'Search text must be 80 characters or fewer.' });
  }
  const normalizedQuery = query.slice(0, 200).toLocaleLowerCase();
  const matches = normalizedQuery
    ? products.filter((product) => `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase().includes(normalizedQuery))
    : products;
  return res.json({ items: matches, count: matches.length, mode: currentMode });
});

app.get('/api/products/:id', (req, res) => {
  if (!/^\d{1,6}$/.test(req.params.id)) return res.status(400).json({ error: 'Product id must be numeric.' });
  const product = products.find((item) => item.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  return res.json(product);
});

app.post('/api/login', (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { email, password } = body;

  if (currentMode === 'training') {
    return res.json({
      ok: true,
      simulated: true,
      sessionIssued: false,
      message: 'Training simulation: credentials were not checked. No session or access was granted.'
    });
  }

  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  }
  if (email !== demoAccount.email || password !== demoAccount.password) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { email: demoAccount.email, createdAt: Date.now() });
  res.setHeader('Set-Cookie', `minishop_session=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`);
  return res.json({ ok: true, message: 'Signed in with the synthetic lab account.' });
});

app.post('/api/logout', (req, res) => {
  const sessionId = cookieValue(req, 'minishop_session');
  if (sessionId) sessions.delete(sessionId);
  res.setHeader('Set-Cookie', 'minishop_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  return res.json({ ok: true });
});

app.get('/api/account', requireSession, (req, res) => {
  return res.json({ email: req.session.email, accountType: 'synthetic-demo' });
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', fallthrough: true }));
app.get('*splat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  return res.status(500).json({ error: 'Unexpected local server error.' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`MiniShop Lab listening at http://127.0.0.1:${port}`);
});

module.exports = { app, server };