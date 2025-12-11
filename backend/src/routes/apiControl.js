const express = require('express');
const router = express.Router();
const database = require('../models/database');
const config = require('../config');
const logger = require('../utils/logger');

// Get all API providers by category
router.get('/providers', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM api_providers';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, priority DESC';

    const providers = database.query(query, params);
    res.json({ success: true, data: providers });
  } catch (error) {
    logger.error('Error fetching API providers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current configuration
router.get('/config', async (req, res) => {
  try {
    const configuration = {
      email: {
        active: config.email.active,
        providers: Object.keys(config.email.providers).map(name => ({
          name,
          enabled: config.email.providers[name].enabled
        }))
      },
      emailFinder: {
        active: config.emailFinder.active,
        providers: Object.keys(config.emailFinder.providers).map(name => ({
          name,
          enabled: config.emailFinder.providers[name].enabled
        }))
      },
      scraping: {
        active: config.scraping.active,
        providers: Object.keys(config.scraping.providers).map(name => ({
          name,
          enabled: config.scraping.providers[name].enabled
        }))
      },
      notifications: {
        whatsapp: config.notifications.whatsapp.enabled,
        firebase: config.notifications.firebase.enabled,
        onesignal: config.notifications.onesignal.enabled
      },
      ai: {
        active: config.ai.active,
        providers: Object.keys(config.ai.providers).map(name => ({
          name,
          enabled: config.ai.providers[name].enabled,
          model: config.ai.providers[name].model
        }))
      }
    };

    res.json({ success: true, data: configuration });
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update active provider for a category
router.post('/providers/activate', async (req, res) => {
  try {
    const { category, providerName } = req.body;

    if (!category || !providerName) {
      return res.status(400).json({
        success: false,
        error: 'category and providerName are required'
      });
    }

    // Check if provider exists in config
    let validProvider = false;
    if (category === 'email' && config.email.providers[providerName]) {
      config.email.active = providerName;
      validProvider = true;
    } else if (category === 'emailFinder' && config.emailFinder.providers[providerName]) {
      config.emailFinder.active = providerName;
      validProvider = true;
    } else if (category === 'scraping' && config.scraping.providers[providerName]) {
      config.scraping.active = providerName;
      validProvider = true;
    } else if (category === 'ai' && config.ai.providers[providerName]) {
      config.ai.active = providerName;
      validProvider = true;
    }

    if (!validProvider) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category or provider name'
      });
    }

    // Update database
    database.query(
      'UPDATE api_providers SET is_active = 0 WHERE category = ?',
      [category]
    );

    database.query(
      `INSERT INTO api_providers (category, provider_name, is_active, priority)
       VALUES (?, ?, 1, 100)
       ON CONFLICT(category, provider_name) DO UPDATE SET is_active = 1, priority = 100`,
      [category, providerName]
    );

    res.json({
      success: true,
      message: `${providerName} activated for ${category}`
    });
  } catch (error) {
    logger.error('Error activating provider:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test API provider connection
router.post('/providers/test', async (req, res) => {
  try {
    const { category, providerName } = req.body;

    if (!category || !providerName) {
      return res.status(400).json({
        success: false,
        error: 'category and providerName are required'
      });
    }

    // Simple connectivity test
    let testResult = { success: false, message: 'Provider not configured' };

    if (category === 'email') {
      const provider = config.email.providers[providerName];
      testResult = { success: provider?.enabled || false, message: provider?.enabled ? 'Provider configured' : 'Provider not configured' };
    } else if (category === 'ai') {
      const provider = config.ai.providers[providerName];
      testResult = { success: provider?.enabled || false, message: provider?.enabled ? 'API key configured' : 'API key not configured' };
    }

    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    logger.error('Error testing provider:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get provider statistics
router.get('/providers/:category/:name/stats', async (req, res) => {
  try {
    const { category, name } = req.params;

    const provider = database.query(
      'SELECT * FROM api_providers WHERE category = ? AND provider_name = ?',
      [category, name]
    )[0];

    if (!provider) {
      return res.json({
        success: true,
        data: {
          success_count: 0,
          error_count: 0,
          last_used: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        success_count: provider.success_count,
        error_count: provider.error_count,
        last_used: provider.last_used,
        success_rate: provider.success_count + provider.error_count > 0
          ? ((provider.success_count / (provider.success_count + provider.error_count)) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching provider stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
