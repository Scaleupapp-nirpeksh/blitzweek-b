const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const registrationRoutes = require('./routes/registrationRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

/* ───────── TRUST PROXY (MUST BE FIRST) ───────── */
app.set('trust proxy', 1); // Trust first proxy

/* ───────── CORS ───────── */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://theblitzweek.com',
  'https://www.theblitzweek.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

/* ───────── Security ───────── */
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

/* ───────── Body parsing ───────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ───────── Logging Middleware ───────── */
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
  trustProxy: true // Add this
});

const registrationLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true // Add this
});

app.use('/api/', limiter);
app.use('/api/register', registrationLimiter);

/* ───────── MongoDB ───────── */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blitzweek';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

/* ───────── Routes ───────── */
app.use('/api', registrationRoutes);
app.use('/api', statsRoutes);

/* ───────── Health Check Routes ───────── */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Add /api/health endpoint for frontend compatibility
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

/* ───────── Test Route ───────── */
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    headers: req.headers,
    origin: req.headers.origin || 'No origin'
  });
});

/* ───────── Root ───────── */
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
      apiHealth: 'GET /api/health',
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
  console.log(`✅ CORS enabled for origins:`, allowedOrigins);
});

module.exports = app;