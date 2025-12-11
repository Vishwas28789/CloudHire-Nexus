const express = require('express');
const router = express.Router();
const database = require('../models/database');
const aiService = require('../services/ai');
const logger = require('../utils/logger');

// Get all feature rules
router.get('/rules', async (req, res) => {
  try {
    const { featureName, isActive } = req.query;
    let query = 'SELECT * FROM feature_rules WHERE 1=1';
    const params = [];

    if (featureName) {
      query += ' AND feature_name = ?';
      params.push(featureName);
    }

    if (isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const rules = database.query(query, params);
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('Error fetching feature rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update rule using natural language
router.post('/rules', async (req, res) => {
  try {
    const { instruction, featureName } = req.body;

    if (!instruction) {
      return res.status(400).json({
        success: false,
        error: 'Natural language instruction is required'
      });
    }

    // Use AI to parse instruction and create rule
    const rule = await aiService.parseFeatureInstruction(instruction, featureName);

    const result = database.query(
      `INSERT INTO feature_rules (feature_name, rule_type, rule_definition, created_by)
       VALUES (?, ?, ?, ?)`,
      [rule.featureName, rule.ruleType, JSON.stringify(rule.definition), 'ai']
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        ...rule
      },
      message: 'Feature rule created from natural language'
    });
  } catch (error) {
    logger.error('Error creating feature rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update rule status
router.patch('/rules/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    database.query(
      'UPDATE feature_rules SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive ? 1 : 0, id]
    );

    res.json({ success: true, message: 'Rule status updated' });
  } catch (error) {
    logger.error('Error updating rule status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM feature_rules WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    logger.error('Error deleting rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Modify template using natural language
router.post('/templates/modify', async (req, res) => {
  try {
    const { templateType, instruction } = req.body;

    if (!templateType || !instruction) {
      return res.status(400).json({
        success: false,
        error: 'templateType and instruction are required'
      });
    }

    const result = await aiService.modifyTemplate(templateType, instruction);

    res.json({
      success: true,
      data: result,
      message: 'Template modified based on instruction'
    });
  } catch (error) {
    logger.error('Error modifying template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test rule against sample data
router.post('/rules/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;

    const rule = database.query('SELECT * FROM feature_rules WHERE id = ?', [id])[0];

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const result = await aiService.testRule(rule, testData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error testing rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
