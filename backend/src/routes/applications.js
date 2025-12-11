const express = require('express');
const router = express.Router();
const database = require('../models/database');
const autoApplyService = require('../services/autoApply');
const logger = require('../utils/logger');

// Get all applications
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT a.*, j.title as job_title, j.company FROM applications a JOIN jobs j ON a.job_id = j.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const applications = database.query(query, params);
    res.json({ success: true, data: applications });
  } catch (error) {
    logger.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get application by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = database.query(`
      SELECT a.*, j.title as job_title, j.company, j.url as job_url
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [id])[0];

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    logger.error('Error fetching application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create application (auto-apply)
router.post('/', async (req, res) => {
  try {
    const { jobId, profileId, resumeId, method } = req.body;

    if (!jobId || !profileId) {
      return res.status(400).json({
        success: false,
        error: 'jobId and profileId are required'
      });
    }

    const result = await autoApplyService.applyToJob({
      jobId,
      profileId,
      resumeId,
      method: method || 'auto'
    });

    res.json({
      success: true,
      data: result,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    logger.error('Error creating application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update application status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (notes) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    // Update date fields based on status
    if (status === 'applied') {
      updateFields.push('applied_date = CURRENT_TIMESTAMP');
    } else if (status === 'interview') {
      updateFields.push('interview_date = CURRENT_TIMESTAMP');
    } else if (status === 'offer') {
      updateFields.push('offer_date = CURRENT_TIMESTAMP');
    } else if (status === 'rejected') {
      updateFields.push('rejection_date = CURRENT_TIMESTAMP');
    }

    params.push(id);

    database.query(
      `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Application status updated' });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send follow-up email
router.post('/:id/followup', async (req, res) => {
  try {
    const { id } = req.params;
    const application = database.query('SELECT * FROM applications WHERE id = ?', [id])[0];

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const result = await autoApplyService.sendFollowUp(application);

    database.query(
      'UPDATE applications SET follow_up_count = follow_up_count + 1, last_follow_up = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: result,
      message: 'Follow-up email sent'
    });
  } catch (error) {
    logger.error('Error sending follow-up:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get application statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = {
      total: database.query('SELECT COUNT(*) as count FROM applications')[0].count,
      byStatus: database.query(`
        SELECT status, COUNT(*) as count 
        FROM applications 
        GROUP BY status
      `),
      callbackRate: 0,
      offerRate: 0
    };

    const total = stats.total;
    if (total > 0) {
      const callbacks = database.query(
        "SELECT COUNT(*) as count FROM applications WHERE status IN ('interview', 'offer')"
      )[0].count;
      const offers = database.query(
        "SELECT COUNT(*) as count FROM applications WHERE status = 'offer'"
      )[0].count;

      stats.callbackRate = ((callbacks / total) * 100).toFixed(2);
      stats.offerRate = ((offers / total) * 100).toFixed(2);
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching application stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM applications WHERE id = ?', [id]);
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
