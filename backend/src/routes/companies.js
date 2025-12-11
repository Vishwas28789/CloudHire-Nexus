const express = require('express');
const router = express.Router();
const database = require('../models/database');
const companyScraperService = require('../services/companyScraper');
const logger = require('../utils/logger');

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM companies WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR domain LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const companies = database.query(query, params);
    res.json({ success: true, data: companies });
  } catch (error) {
    logger.error('Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = database.query('SELECT * FROM companies WHERE id = ?', [id])[0];

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Get jobs for this company
    const jobs = database.query('SELECT * FROM jobs WHERE company = ? ORDER BY created_at DESC', [company.name]);

    res.json({
      success: true,
      data: {
        ...company,
        jobs
      }
    });
  } catch (error) {
    logger.error('Error fetching company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add companies (Company Targeter)
router.post('/target', async (req, res) => {
  try {
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({
        success: false,
        error: 'Companies array is required'
      });
    }

    const results = await companyScraperService.targetCompanies(companies);

    res.json({
      success: true,
      data: results,
      message: 'Companies targeted successfully'
    });
  } catch (error) {
    logger.error('Error targeting companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scrape company career page
router.post('/:id/scrape', async (req, res) => {
  try {
    const { id } = req.params;
    const company = database.query('SELECT * FROM companies WHERE id = ?', [id])[0];

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const jobs = await companyScraperService.scrapeCompanyJobs(company);

    database.query(
      'UPDATE companies SET last_scraped = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: jobs,
      message: 'Company jobs scraped successfully'
    });
  } catch (error) {
    logger.error('Error scraping company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { domain, career_page_url, industry, size, location, description } = req.body;

    const updates = [];
    const params = [];

    if (domain !== undefined) {
      updates.push('domain = ?');
      params.push(domain);
    }
    if (career_page_url !== undefined) {
      updates.push('career_page_url = ?');
      params.push(career_page_url);
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      params.push(industry);
    }
    if (size !== undefined) {
      updates.push('size = ?');
      params.push(size);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    database.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Company updated' });
  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
