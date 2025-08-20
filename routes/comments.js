const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const comments = await query(
      `SELECT c.*, u.username, u.first_name, u.last_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.is_active = 1
       ORDER BY c.created_at ASC
       LIMIT ? OFFSET ?`,
      [postId, limit, offset]
    );

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
router.post('/', protect, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 500 })
    .withMessage('Comment content must be less than 500 characters'),
  body('postId')
    .notEmpty()
    .withMessage('Post ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, postId } = req.body;

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

    const result = await query(
      'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [postId, req.user.id, content]
    );

    const commentId = result.insertId;

    // Get the created comment
    const comments = await query(
      `SELECT c.*, u.username, u.first_name, u.last_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comments[0]
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
router.put('/:id', protect, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 500 })
    .withMessage('Comment content must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const commentId = req.params.id;
    const { content } = req.body;

    // Check if comment exists and belongs to user
    const existingComments = await query(
      'SELECT id FROM comments WHERE id = ? AND user_id = ? AND is_active = 1',
      [commentId, req.user.id]
    );

    if (existingComments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or not authorized'
      });
    }

    await query(
      'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?',
      [content, commentId]
    );

    // Get updated comment
    const comments = await query(
      `SELECT c.*, u.username, u.first_name, u.last_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comments[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const commentId = req.params.id;

    // Check if comment exists and belongs to user
    const existingComments = await query(
      'SELECT id FROM comments WHERE id = ? AND user_id = ? AND is_active = 1',
      [commentId, req.user.id]
    );

    if (existingComments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or not authorized'
      });
    }

    // Soft delete
    await query(
      'UPDATE comments SET is_active = 0, deleted_at = NOW() WHERE id = ?',
      [commentId]
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
