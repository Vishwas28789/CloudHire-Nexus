const express = require('express');
const router = express.Router();
const database = require('../models/database');
const resumeService = require('../services/resumeGenerator');
const logger = require('../utils/logger');

// Get all resumes
router.get('/', async (req, res) => {
  try {
    const { profileId, jobId } = req.query;
    let query = 'SELECT * FROM resumes WHERE 1=1';
    const params = [];

    if (profileId) {
      query += ' AND profile_id = ?';
      params.push(profileId);
    }

    if (jobId) {
      query += ' AND job_id = ?';
      params.push(jobId);
    }

    query += ' ORDER BY created_at DESC';

    const resumes = database.query(query, params);
    res.json({ success: true, data: resumes });
  } catch (error) {
    logger.error('Error fetching resumes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get resume by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resume = database.query('SELECT * FROM resumes WHERE id = ?', [id])[0];

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    res.json({ success: true, data: resume });
  } catch (error) {
    logger.error('Error fetching resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate resume for a job
router.post('/generate', async (req, res) => {
  try {
    const { jobId, profileId, templateName, countryVariant, roleVariant } = req.body;

    if (!jobId || !profileId) {
      return res.status(400).json({
        success: false,
        error: 'jobId and profileId are required'
      });
    }

    const resume = await resumeService.generateResume({
      jobId,
      profileId,
      templateName: templateName || 'standard',
      countryVariant,
      roleVariant
    });

    res.json({
      success: true,
      data: resume,
      message: 'Resume generated successfully'
    });
  } catch (error) {
    logger.error('Error generating resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tailor resume for specific job
router.post('/:id/tailor', async (req, res) => {
  try {
    const { id } = req.params;
    const resume = database.query('SELECT * FROM resumes WHERE id = ?', [id])[0];

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const tailored = await resumeService.tailorResume(resume);

    res.json({
      success: true,
      data: tailored,
      message: 'Resume tailored successfully'
    });
  } catch (error) {
    logger.error('Error tailoring resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get resume templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = resumeService.getAvailableTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete resume
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM resumes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    logger.error('Error deleting resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
