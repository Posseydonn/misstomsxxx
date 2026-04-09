import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import chatRouter from './routes/chat.js';
import { initDb } from './services/postgres.js';

const PORT = process.env.PORT || 3001;
const configuredOrigins =
  process.env.ALLOWED_ORIGINS ??
  process.env.ALLOWED_ORIGIN ??
  'https://misstom.ru';

const ALLOWED_ORIGINS = new Set(
  configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.add('http://localhost:5173');
  ALLOWED_ORIGINS.add('http://127.0.0.1:5173');
  ALLOWED_ORIGINS.add('http://localhost:4173');
  ALLOWED_ORIGINS.add('http://127.0.0.1:4173');
  ALLOWED_ORIGINS.add('http://localhost:8080');
  ALLOWED_ORIGINS.add('http://127.0.0.1:8080');
}

const app = express();

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
      if (origin && ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// Body parsing
app.use(express.json({ limit: '16kb' }));

// Rate limiting: 30 requests/min per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте через минуту.' },
  keyGenerator: (req) => req.ip,
});
app.use('/api/', limiter);

// Routes
app.use('/api/chat', chatRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Server] error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[Server] running on port ${PORT}`);
      console.log(`[Server] CORS allowed for: ${Array.from(ALLOWED_ORIGINS).join(', ')}`);
    });
  } catch (err) {
    console.error('[Server] startup failed:', err.message);
    process.exit(1);
  }
}

start();
