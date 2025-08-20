const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all posts (with pagination)
// @route   GET /api/posts
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.query.userId;

    let whereClause = 'WHERE p.is_active = 1';
    let params = [];

    if (userId) {
      whereClause += ' AND p.user_id = ?';
      params.push(userId);
    }

    const posts = await query(
      `SELECT p.*, u.username, u.first_name, u.last_name, u.avatar,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = 1) as comments_count,
              ${req.user ? '(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked' : '0 as is_liked'}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      req.user ? [...params, req.user.id, limit, offset] : [...params, limit, offset]
    );

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const postId = req.params.id;

    const posts = await query(
      `SELECT p.*, u.username, u.first_name, u.last_name, u.avatar,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_active = 1) as comments_count,
              ${req.user ? '(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked' : '0 as is_liked'}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.is_active = 1`,
      req.user ? [req.user.id, postId] : [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: posts[0]
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, image } = req.body;

    const result = await query(
      'INSERT INTO posts (user_id, content, image, created_at) VALUES (?, ?, ?, NOW())',
      [req.user.id, content, image || null]
    );

    const postId = result.insertId;

    // Get the created post
    const posts = await query(
      `SELECT p.*, u.username, u.first_name, u.last_name, u.avatar
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId]
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: posts[0]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const postId = req.params.id;
    const { content, image } = req.body;

    // Check if post exists and belongs to user
    const existingPosts = await query(
      'SELECT id FROM posts WHERE id = ? AND user_id = ? AND is_active = 1',
      [postId, req.user.id]
    );

    if (existingPosts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or not authorized'
      });
    }

    await query(
      'UPDATE posts SET content = ?, image = ?, updated_at = NOW() WHERE id = ?',
      [content, image || null, postId]
    );

    // Get updated post
    const posts = await query(
      `SELECT p.*, u.username, u.first_name, u.last_name, u.avatar
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId]
    );

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: posts[0]
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists and belongs to user
    const existingPosts = await query(
      'SELECT id FROM posts WHERE id = ? AND user_id = ? AND is_active = 1',
      [postId, req.user.id]
    );

    if (existingPosts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or not authorized'
      });
    }

    // Soft delete
    await query(
      'UPDATE posts SET is_active = 0, deleted_at = NOW() WHERE id = ?',
      [postId]
    );

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const posts = await query(
      'SELECT id FROM posts WHERE id = ? AND is_active = 1',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if already liked
    const existingLikes = await query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.id]
    );

    if (existingLikes.length > 0) {
      // Unlike
      await query(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, req.user.id]
      );

      res.json({
        success: true,
        message: 'Post unliked successfully',
        liked: false
      });
    } else {
      // Like
      await query(
        'INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, NOW())',
        [postId, req.user.id]
      );

      res.json({
        success: true,
        message: 'Post liked successfully',
        liked: true
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
