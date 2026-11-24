const express = require('express');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { scanWebsite } = require('./src/scanner');
const { generateCsvReport } = require('./src/exporters/csvExporter');
const { generatePdfBuffer } = require('./src/exporters/pdfExporter');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BOOT_LAST_MODIFIED = new Date().toUTCString();

app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));

// Complete Security, Caching & SEO HTTP Response Headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
  );

  if (!req.path.startsWith('/api/')) {
    res.setHeader('Last-Modified', BOOT_LAST_MODIFIED);
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader(
        'X-Robots-Tag',
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      );
    } else if (/\.(css|js|png|jpg|jpeg|webp|avif|svg|ico|woff2)$/i.test(req.path)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  } else {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Lightweight Gzip compression for HTML, CSS, JS, XML, JSON, and text responses
app.use((req, res, next) => {
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  if (!acceptEncoding.includes('gzip') || req.path.startsWith('/api/export/pdf')) {
    return next();
  }

  // Handle compressed text static files directly for fast TTFB and Content-Encoding: gzip
  const cleanPath = req.path === '/' ? '/index.html' : req.path;
  if (/\.(html|css|js|xml|txt|json|webmanifest|svg)$/i.test(cleanPath) && !cleanPath.includes('..')) {
    const filePath = path.join(PUBLIC_DIR, cleanPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.xml': 'application/xml; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.svg': 'image/svg+xml',
      };
      if (mimeMap[ext]) {
        res.setHeader('Content-Type', mimeMap[ext]);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        return fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
      }
    }
  }

  return next();
});

// Explicitly serve /.well-known/ai.txt and static assets (dotfiles allowed for .well-known)
app.use(
  express.static(PUBLIC_DIR, {
    dotfiles: 'allow',
    etag: true,
    lastModified: true,
  })
);

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'VentureRush Tech SEO GEO AEO Checker',
    domain: 'sgachecker.venturerushtech.com',
  });
});

// Live scan endpoint
app.post('/api/scan', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Please provide a website URL to scan.' });
  }

  try {
    const report = await scanWebsite(url);
    return res.json(report);
  } catch (err) {
    return res.status(400).json({
      error: err.message || 'Failed to scan the target website. Please verify the URL and try again.',
    });
  }
});

// CSV export endpoint
app.post('/api/export/csv', (req, res) => {
  const { report } = req.body || {};
  if (!report || !Array.isArray(report.checks)) {
    return res.status(400).json({ error: 'Invalid report payload for CSV export.' });
  }

  const csv = generateCsvReport(report);
  const safeDomain = String(report.meta?.domain || 'website').replace(/[^a-zA-Z0-9.-]/g, '_');
  const date = report.meta?.scanDate || new Date().toISOString().slice(0, 10);
  const filename = `venturerush-seo-aeo-geo-report-${safeDomain}-${date}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
});

// PDF export endpoint
app.post('/api/export/pdf', async (req, res) => {
  const { report } = req.body || {};
  if (!report || !Array.isArray(report.checks)) {
    return res.status(400).json({ error: 'Invalid report payload for PDF export.' });
  }

  try {
    const pdfBuffer = await generatePdfBuffer(report);
    const safeDomain = String(report.meta?.domain || 'website').replace(/[^a-zA-Z0-9.-]/g, '_');
    const date = report.meta?.scanDate || new Date().toISOString().slice(0, 10);
    const filename = `VentureRush-SEO-AEO-GEO-Report-${safeDomain}-${date}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF report.' });
  }
});

app.listen(PORT, () => {
  console.log(`VentureRush Tech SEO GEO AEO Checker running at http://localhost:${PORT}`);
});
