// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const registrationRoutes = require('./routes/registrationRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

/* ───────── CORS - MUST BE FIRST ───────── */
// Simple CORS for development
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: [
      'https://theblitzweek.com',
      'https://www.theblitzweek.com',
      'https://blitzweek.vercel.app'
    ],
    credentials: true
  }));
} else {
  // In development, allow all origins
  app.use(cors({
    origin: true,
    credentials: true
  }));
}

/* ───────── Security (after CORS) ───────── */
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

/* ───────── Body parsing ───────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ───────── Logging Middleware (for debugging) ───────── */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

/* ───────── Rate limiting ───────── */
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/register', registrationLimiter);

/* ───────── MongoDB ───────── */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blitzweek';

mongoose
  .connect(MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

/* ───────── Routes ───────── */
app.use('/api', registrationRoutes);
app.use('/api', statsRoutes);

/* ───────── Test Routes ───────── */
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    headers: req.headers,
    origin: req.headers.origin || 'No origin'
  });
});

/* ───────── Health & Root ───────── */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ScaleUp Blitz Week Registration API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/register',
      checkRegistration: 'GET /api/check-registration/:identifier',
      stats: 'GET /api/stats',
      statsLive: 'GET /api/stats/live-count',
      health: 'GET /health',
      test: 'GET /api/test'
    },
  });
});

/* ───────── Error handling ───────── */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Something went wrong!',
      status: err.status || 500,
    },
  });
});

/* ───────── 404 handler ───────── */
app.use((req, res) => {
  console.log(`404 - Not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

/* ───────── Server ───────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`✅ CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'Production origins' : 'All origins (dev mode)'}`);
});

module.exports = app;