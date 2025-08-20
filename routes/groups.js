const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = 'WHERE g.is_active = 1';
    let params = [];

    if (search) {
      whereClause += ' AND (g.name LIKE ? OR g.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm];
    }

    const groups = await query(
      `SELECT g.*, u.username as creator_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count,
              ${req.user ? '(SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member' : '0 as is_member'}
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      req.user ? [...params, req.user.id, limit, offset] : [...params, limit, offset]
    );

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const groupId = req.params.id;

    const groups = await query(
      `SELECT g.*, u.username as creator_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count,
              ${req.user ? '(SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member' : '0 as is_member'}
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       WHERE g.id = ? AND g.is_active = 1`,
      req.user ? [req.user.id, groupId] : [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: groups[0]
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create group
// @route   POST /api/groups
// @access  Private
router.post('/', protect, [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, isPrivate = false } = req.body;

    const result = await query(
      'INSERT INTO groups (name, description, creator_id, is_private, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, description || null, req.user.id, isPrivate]
    );

    const groupId = result.insertId;

    // Add creator as member
    await query(
      'INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [groupId, req.user.id, 'admin']
    );

    // Get the created group
    const groups = await query(
      `SELECT g.*, u.username as creator_name
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       WHERE g.id = ?`,
      [groupId]
    );

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: groups[0]
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const groups = await query(
      'SELECT id, is_private FROM groups WHERE id = ? AND is_active = 1',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if already a member
    const existingMembership = await query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (existingMembership.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this group'
      });
    }

    // Add member
    await query(
      'INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [groupId, req.user.id, 'member']
    );

    res.json({
      success: true,
      message: 'Joined group successfully'
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Leave group
// @route   DELETE /api/groups/:id/join
// @access  Private
router.delete('/:id/join', protect, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const groups = await query(
      'SELECT id, creator_id FROM groups WHERE id = ? AND is_active = 1',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is creator
    if (groups[0].creator_id == req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Group creator cannot leave the group'
      });
    }

    // Remove member
    const result = await query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'Not a member of this group'
      });
    }

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get group members
// @route   GET /api/groups/:id/members
// @access  Public
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const members = await query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ? AND u.is_active = 1
       ORDER BY gm.joined_at ASC
       LIMIT ? OFFSET ?`,
      [groupId, limit, offset]
    );

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
