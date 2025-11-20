const express = require('express');
const router = express.Router();
const database = require('../models/database');
const logger = require('../utils/logger');

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const analytics = {
      applications: {
        total: database.query('SELECT COUNT(*) as count FROM applications')[0].count,
        pending: database.query("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'")[0].count,
        applied: database.query("SELECT COUNT(*) as count FROM applications WHERE status = 'applied'")[0].count,
        interview: database.query("SELECT COUNT(*) as count FROM applications WHERE status = 'interview'")[0].count,
        offer: database.query("SELECT COUNT(*) as count FROM applications WHERE status = 'offer'")[0].count,
        rejected: database.query("SELECT COUNT(*) as count FROM applications WHERE status = 'rejected'")[0].count
      },
      jobs: {
        total: database.query('SELECT COUNT(*) as count FROM jobs')[0].count,
        discovered: database.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'discovered'")[0].count,
        filtered: database.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'filtered'")[0].count,
        cloudRelated: database.query('SELECT COUNT(*) as count FROM jobs WHERE is_cloud_related = 1')[0].count
      },
      rates: {
        callbackRate: 0,
        interviewRate: 0,
        offerRate: 0
      },
      timeline: database.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM applications
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `),
      byCountry: database.query(`
        SELECT j.location, COUNT(*) as count
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.location IS NOT NULL
        GROUP BY j.location
        ORDER BY count DESC
        LIMIT 10
      `)
    };

    // Calculate rates
    const totalApplied = analytics.applications.applied + analytics.applications.interview + 
                        analytics.applications.offer + analytics.applications.rejected;
    
    if (totalApplied > 0) {
      const callbacks = analytics.applications.interview + analytics.applications.offer;
      analytics.rates.callbackRate = ((callbacks / totalApplied) * 100).toFixed(2);
      analytics.rates.interviewRate = ((analytics.applications.interview / totalApplied) * 100).toFixed(2);
      analytics.rates.offerRate = ((analytics.applications.offer / totalApplied) * 100).toFixed(2);
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get resume analytics
router.get('/resumes', async (req, res) => {
  try {
    const analytics = {
      total: database.query('SELECT COUNT(*) as count FROM resumes')[0].count,
      byTemplate: database.query(`
        SELECT template_name, COUNT(*) as count
        FROM resumes
        GROUP BY template_name
      `),
      tailored: database.query('SELECT COUNT(*) as count FROM resumes WHERE tailored = 1')[0].count,
      successRate: database.query(`
        SELECT 
          r.template_name,
          COUNT(DISTINCT a.id) as applications,
          SUM(CASE WHEN a.status IN ('interview', 'offer') THEN 1 ELSE 0 END) as callbacks
        FROM resumes r
        LEFT JOIN applications a ON r.id = a.resume_id
        WHERE a.status IS NOT NULL
        GROUP BY r.template_name
      `)
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error fetching resume analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job source analytics
router.get('/sources', async (req, res) => {
  try {
    const analytics = database.query(`
      SELECT 
        source,
        COUNT(*) as total_jobs,
        SUM(CASE WHEN is_cloud_related = 1 THEN 1 ELSE 0 END) as cloud_jobs,
        AVG(score) as avg_score
      FROM jobs
      GROUP BY source
      ORDER BY total_jobs DESC
    `);

    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error fetching source analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log analytics event
router.post('/events', async (req, res) => {
  try {
    const { eventType, eventCategory, eventData } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType is required' });
    }

    database.query(
      'INSERT INTO analytics_events (event_type, event_category, event_data) VALUES (?, ?, ?)',
      [eventType, eventCategory, JSON.stringify(eventData || {})]
    );

    res.json({ success: true, message: 'Event logged' });
  } catch (error) {
    logger.error('Error logging analytics event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get time-based statistics
router.get('/timeline', async (req, res) => {
  try {
    const { days = 30, type = 'applications' } = req.query;

    let query;
    if (type === 'applications') {
      query = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM applications
        WHERE created_at >= datetime('now', '-${parseInt(days)} days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    } else if (type === 'jobs') {
      query = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM jobs
        WHERE created_at >= datetime('now', '-${parseInt(days)} days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    }

    const timeline = database.query(query);
    res.json({ success: true, data: timeline });
  } catch (error) {
    logger.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
