const express = require('express');
const router = express.Router();
const database = require('../models/database');
const logger = require('../utils/logger');

// Get user profile
router.get('/', async (req, res) => {
  try {
    const profile = database.query('SELECT * FROM profiles ORDER BY id DESC LIMIT 1')[0];
    res.json({ success: true, data: profile || null });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update profile
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      linkedin_url,
      github_url,
      portfolio_url,
      current_title,
      years_experience,
      skills,
      certifications,
      education,
      location,
      preferred_locations,
      target_roles
    } = req.body;

    // Check if profile exists
    const existing = database.query('SELECT id FROM profiles LIMIT 1')[0];

    if (existing) {
      // Update existing profile
      database.query(`
        UPDATE profiles SET
          name = ?,
          email = ?,
          phone = ?,
          linkedin_url = ?,
          github_url = ?,
          portfolio_url = ?,
          current_title = ?,
          years_experience = ?,
          skills = ?,
          certifications = ?,
          education = ?,
          location = ?,
          preferred_locations = ?,
          target_roles = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name, email, phone, linkedin_url, github_url, portfolio_url,
        current_title, years_experience, skills, certifications,
        education, location, preferred_locations, target_roles,
        existing.id
      ]);

      res.json({ success: true, message: 'Profile updated', id: existing.id });
    } else {
      // Create new profile
      const result = database.query(`
        INSERT INTO profiles (
          name, email, phone, linkedin_url, github_url, portfolio_url,
          current_title, years_experience, skills, certifications,
          education, location, preferred_locations, target_roles
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, email, phone, linkedin_url, github_url, portfolio_url,
        current_title, years_experience, skills, certifications,
        education, location, preferred_locations, target_roles
      ]);

      res.json({ success: true, message: 'Profile created', id: result.lastInsertRowid });
    }
  } catch (error) {
    logger.error('Error saving profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extract profile from URL
router.post('/extract', async (req, res) => {
  try {
    const { url, type } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const profileExtractor = require('../services/profileExtractor');
    const extractedData = await profileExtractor.extractProfile(url, type);

    res.json({
      success: true,
      data: extractedData,
      message: 'Profile extracted successfully'
    });
  } catch (error) {
    logger.error('Error extracting profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
