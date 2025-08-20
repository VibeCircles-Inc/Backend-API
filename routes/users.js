const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = 'WHERE is_active = 1';
    let params = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    // Get users
    const users = await query(
      `SELECT id, username, first_name, last_name, avatar, bio, created_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const users = await query(
      `SELECT id, username, first_name, last_name, avatar, bio, location, website, 
              created_at, last_login 
       FROM users WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = users[0];

    // Get user stats
    const stats = await query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_active = 1) as posts_count,
        (SELECT COUNT(*) FROM followers WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = ?) as following_count`,
      [userId, userId, userId]
    );

    user.stats = stats[0];

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, bio, location, website } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      params.push(firstName);
    }

    if (lastName !== undefined) {
      updates.push('last_name = ?');
      params.push(lastName);
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }

    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }

    if (website !== undefined) {
      updates.push('website = ?');
      params.push(website);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(req.user.id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated user
    const users = await query(
      'SELECT id, username, email, first_name, last_name, avatar, bio, location, website, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Follow user
// @route   POST /api/users/:id/follow
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const userIdToFollow = req.params.id;

    // Check if user is trying to follow themselves
    if (req.user.id == userIdToFollow) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }

    // Check if user to follow exists
    const users = await query(
      'SELECT id FROM users WHERE id = ? AND is_active = 1',
      [userIdToFollow]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already following
    const existingFollow = await query(
      'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?',
      [req.user.id, userIdToFollow]
    );

    if (existingFollow.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }

    // Create follow relationship
    await query(
      'INSERT INTO followers (follower_id, following_id, created_at) VALUES (?, ?, NOW())',
      [req.user.id, userIdToFollow]
    );

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Unfollow user
// @route   DELETE /api/users/:id/follow
// @access  Private
router.delete('/:id/follow', protect, async (req, res) => {
  try {
    const userIdToUnfollow = req.params.id;

    // Delete follow relationship
    const result = await query(
      'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
      [req.user.id, userIdToUnfollow]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'Not following this user'
      });
    }

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
router.get('/:id/followers', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const followers = await query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, f.created_at as followed_at
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ? AND u.is_active = 1
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: followers
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const following = await query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, f.created_at as followed_at
       FROM followers f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ? AND u.is_active = 1
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: following
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
