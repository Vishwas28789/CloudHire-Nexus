const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const database = require('./models/database');
const logger = require('./utils/logger');

// Import routes
const jobRoutes = require('./routes/jobs');
const profileRoutes = require('./routes/profile');
const resumeRoutes = require('./routes/resume');
const applicationRoutes = require('./routes/applications');
const companyRoutes = require('./routes/companies');
const recruiterRoutes = require('./routes/recruiters');
const apiControlRoutes = require('./routes/apiControl');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const featureBuilderRoutes = require('./routes/featureBuilder');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env
  });
});

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/control', apiControlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/features', featureBuilderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Initialize database and start server
async function start() {
  try {
    await database.initialize();
    logger.info('Database initialized successfully');

    app.listen(config.port, () => {
      logger.info(`CloudHire Nexus Backend running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Database: ${config.database.type}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  start();
}

module.exports = app;
