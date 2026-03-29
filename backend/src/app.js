require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ─── Static Files (uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d'
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CFActure API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── SEO: Sitemap XML ─────────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const BASE = 'https://facture.innosft.com';

  const urls = [
    { loc: `${BASE}/`,              changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE}/fonctionnalites`, changefreq: 'monthly', priority: '0.9' },
    { loc: `${BASE}/tarifs`,          changefreq: 'weekly',  priority: '0.9' },
    { loc: `${BASE}/register`,        changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE}/contact`,         changefreq: 'monthly', priority: '0.6' },
    { loc: `${BASE}/legal/cgu`,       changefreq: 'yearly',  priority: '0.3' },
    { loc: `${BASE}/legal/privacy`,   changefreq: 'yearly',  priority: '0.3' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
  res.send(xml);
});

// ─── SEO: Robots.txt (fallback si non servi par le frontend) ─────────────────
app.get('/robots.txt', (req, res) => {
  const BASE = 'https://facture.innosft.com';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *
Allow: /
Allow: /fonctionnalites
Allow: /tarifs
Allow: /register
Allow: /contact
Allow: /legal/

Disallow: /app/
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /settings/
Disallow: /*.json$

Sitemap: ${BASE}/sitemap.xml
`);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
