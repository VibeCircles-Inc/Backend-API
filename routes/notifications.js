const express = require('express');
const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const notifications = await query(
      `SELECT n.*, u.username, u.first_name, u.last_name, u.avatar
       FROM notifications n
       JOIN users u ON n.from_user_id = u.id
       WHERE n.to_user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    // Get unread count
    const unreadCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE to_user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadCount[0].count
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const result = await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND to_user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE to_user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const result = await query(
      'DELETE FROM notifications WHERE id = ? AND to_user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
