const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const asteroidRoutes = require('./routes/asteroids');
const simulationRoutes = require('./routes/simulations');
const userRoutes = require('./routes/users');

// Import NASA API service
const nasaApi = require('./utils/nasaApi');
const Asteroid = require('./models/Asteroid');

const app = express();

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',        // Development frontend
    'https://astroimpact.vercel.app', // Production frontend
    process.env.FRONTEND_URL        // Environment-specific URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astroimpact', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Initialize asteroid data from NASA API if database is empty
  try {
    const asteroidCount = await Asteroid.countDocuments();
    if (asteroidCount === 0) {
      console.log('🔄 Database is empty, fetching initial asteroid data from NASA API...');
      await nasaApi.syncAsteroidData();
      console.log('✅ Initial asteroid data loaded from NASA API');
    } else {
      console.log(`📊 Found ${asteroidCount} asteroids in database`);
      
      // Check if data is older than 24 hours and sync if needed
      const lastUpdated = await Asteroid.findOne({}, {}, { sort: { 'metadata.lastUpdated': -1 } });
      if (lastUpdated && lastUpdated.metadata?.lastUpdated) {
        const hoursSinceUpdate = (Date.now() - lastUpdated.metadata.lastUpdated.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate > 24) {
          console.log('🔄 Data is older than 24 hours, syncing with NASA API...');
          await nasaApi.syncAsteroidData();
        }
      }
    }
  } catch (error) {
    console.error('⚠️ Error initializing asteroid data:', error.message);
    console.log('📝 Continuing with existing data or fallback data...');
  }
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/asteroids', asteroidRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'AstroImpact Simulator API',
    version: '1.0.0',
    challenge: 'NASA Space Apps Challenge 2025 - Meteor Madness',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      asteroids: '/api/asteroids',
      simulations: '/api/simulations',
      users: '/api/users',
      health: '/api/health'
    },
    documentation: 'Visit /api/health for system status'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server
if (process.env.NODE_ENV === 'production') {
  // For Vercel deployment - export app
  module.exports = app;
} else {
  // For local development - start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
