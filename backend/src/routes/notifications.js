const express = require('express');
const router = express.Router();
const database = require('../models/database');
const notificationService = require('../services/notifications');
const logger = require('../utils/logger');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const { read, limit = 50 } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (read !== undefined) {
      query += ' AND read = ?';
      params.push(read === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const notifications = database.query(query, params);
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
router.get('/unread/count', async (req, res) => {
  try {
    const count = database.query('SELECT COUNT(*) as count FROM notifications WHERE read = 0')[0].count;
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    database.query('UPDATE notifications SET read = 1 WHERE read = 0');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { type, title, message } = req.body;

    const notification = await notificationService.sendNotification({
      type: type || 'test',
      title: title || 'Test Notification',
      message: message || 'This is a test notification'
    });

    res.json({
      success: true,
      data: notification,
      message: 'Test notification sent'
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    database.query('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all read notifications
router.delete('/clear/read', async (req, res) => {
  try {
    database.query('DELETE FROM notifications WHERE read = 1');
    res.json({ success: true, message: 'Read notifications cleared' });
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
