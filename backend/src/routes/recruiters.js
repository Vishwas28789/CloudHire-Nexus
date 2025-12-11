const express = require('express');
const router = express.Router();
const database = require('../models/database');
const recruiterFinderService = require('../services/recruiterFinder');
const logger = require('../utils/logger');

// Get all recruiter contacts
router.get('/', async (req, res) => {
  try {
    const { jobId, companyId, verified } = req.query;
    let query = 'SELECT * FROM recruiter_contacts WHERE 1=1';
    const params = [];

    if (jobId) {
      query += ' AND job_id = ?';
      params.push(jobId);
    }

    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }

    if (verified !== undefined) {
      query += ' AND verified = ?';
      params.push(verified === 'true' ? 1 : 0);
    }

    query += ' ORDER BY confidence_score DESC, created_at DESC';

    const contacts = database.query(query, params);
    res.json({ success: true, data: contacts });
  } catch (error) {
    logger.error('Error fetching recruiter contacts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recruiter contact by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = database.query('SELECT * FROM recruiter_contacts WHERE id = ?', [id])[0];

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Error fetching recruiter contact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find recruiters for a job
router.post('/find', async (req, res) => {
  try {
    const { jobId, companyName, jobUrl } = req.body;

    if (!jobId && !companyName) {
      return res.status(400).json({
        success: false,
        error: 'jobId or companyName is required'
      });
    }

    const contacts = await recruiterFinderService.findRecruiters({
      jobId,
      companyName,
      jobUrl
    });

    res.json({
      success: true,
      data: contacts,
      message: 'Recruiters found successfully'
    });
  } catch (error) {
    logger.error('Error finding recruiters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await recruiterFinderService.verifyEmail(email);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update contact verification status
router.patch('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    database.query(
      'UPDATE recruiter_contacts SET verified = ? WHERE id = ?',
      [verified ? 1 : 0, id]
    );

    res.json({ success: true, message: 'Contact verification updated' });
  } catch (error) {
    logger.error('Error updating contact verification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contact recruiter
router.post('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, subject } = req.body;

    const contact = database.query('SELECT * FROM recruiter_contacts WHERE id = ?', [id])[0];

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const result = await recruiterFinderService.contactRecruiter({
      contact,
      message,
      subject
    });

    database.query(
      'UPDATE recruiter_contacts SET last_contacted = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: result,
      message: 'Recruiter contacted successfully'
    });
  } catch (error) {
    logger.error('Error contacting recruiter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM recruiter_contacts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    logger.error('Error deleting contact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
