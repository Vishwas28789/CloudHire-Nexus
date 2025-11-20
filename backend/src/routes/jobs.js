const express = require('express');
const router = express.Router();
const database = require('../models/database');
const jobScraperService = require('../services/jobScraper');
const jobFilterService = require('../services/jobFilter');
const logger = require('../utils/logger');

// Get all jobs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      status,
      source,
      minScore,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    if (minScore) {
      query += ' AND score >= ?';
      params.push(parseInt(minScore));
    }

    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY ${sortBy} ${order}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const jobs = database.query(query, params);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = database.query('SELECT * FROM jobs WHERE id = ?', [id])[0];

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger manual job scraping
router.post('/scrape', async (req, res) => {
  try {
    const { source, url, keywords } = req.body;

    if (!source) {
      return res.status(400).json({ success: false, error: 'Source is required' });
    }

    // Queue the scraping job
    const result = await jobScraperService.scrapeJobs({ source, url, keywords });

    res.json({
      success: true,
      message: 'Scraping job queued successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error queueing scrape job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    database.query(
      'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({ success: true, message: 'Job status updated' });
  } catch (error) {
    logger.error('Error updating job status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job score
router.patch('/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (score === undefined) {
      return res.status(400).json({ success: false, error: 'Score is required' });
    }

    database.query(
      'UPDATE jobs SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [parseInt(score), id]
    );

    res.json({ success: true, message: 'Job score updated' });
  } catch (error) {
    logger.error('Error updating job score:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Re-evaluate job with AI
router.post('/:id/evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const job = database.query('SELECT * FROM jobs WHERE id = ?', [id])[0];

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const evaluation = await jobFilterService.evaluateJob(job);

    database.query(
      'UPDATE jobs SET score = ?, is_cloud_related = ?, is_excluded = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [evaluation.score, evaluation.isCloudRelated ? 1 : 0, evaluation.isExcluded ? 1 : 0, id]
    );

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    logger.error('Error evaluating job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM jobs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = {
      total: database.query('SELECT COUNT(*) as count FROM jobs')[0].count,
      byStatus: database.query(`
        SELECT status, COUNT(*) as count 
        FROM jobs 
        GROUP BY status
      `),
      bySource: database.query(`
        SELECT source, COUNT(*) as count 
        FROM jobs 
        GROUP BY source
      `),
      cloudRelated: database.query('SELECT COUNT(*) as count FROM jobs WHERE is_cloud_related = 1')[0].count,
      avgScore: database.query('SELECT AVG(score) as avg FROM jobs')[0].avg
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching job stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
