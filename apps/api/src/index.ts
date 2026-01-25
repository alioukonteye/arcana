import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy for Heroku (required for rate limiting to work correctly)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============ Security Middleware ============

// Helmet - Security headers (XSS, Clickjacking, etc.)
// Configured to allow external images (Google Books covers, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for React dev
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"], // Allow external images
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "http://localhost:*"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.clerk.accounts.dev"],
    }
  }
}));

// CORS - Restrict origins (add production URL when deploying)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting - Global (1000 requests per 15 min in dev, 100 in prod)
const isDev = process.env.NODE_ENV !== 'production';
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Rate limiting - Strict for AI scan (10 per 15 min to control costs)
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Scan limit reached. Please wait before scanning again.' }
});
app.use('/books/scan', scanLimiter);

app.use(express.json({ limit: '10mb' })); // Limit body size

import { booksRouter } from './routes/books.routes';
import { usersRouter } from './routes/users.routes';

// ============ Routes ============
app.use('/books', booksRouter);
app.use('/users', usersRouter);

// ============ Health Check ============

app.get('/', (_req, res) => {
  res.json({
    message: 'Arcana API',
    version: '2.0.0',
    features: ['bulk-shelf-scan', 'family-profiles', 'anti-spoiler'],
  });
});

app.listen(port, () => {
  console.log(`🚀 Arcana API running on port ${port}`);
  console.log(`📚 Bulk Shelf Scan enabled (70% confidence threshold)`);
});
