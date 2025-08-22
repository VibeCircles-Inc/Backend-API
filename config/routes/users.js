const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Get all users (with pagination and search)
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q;

    let queryOptions = {
      select: 'id, username, email, role, created_at, last_login, is_active',
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    };

    // Add search filter if provided
    if (searchQuery) {
      // For Supabase, we'll need to use a different approach for search
      // This is a simplified version - in production you might want to use full-text search
      queryOptions.where = {
        username: searchQuery
      };
    }

    const users = await db.query('users', queryOptions);

    // Get profiles for users
    for (let user of users) {
      const profile = await db.findByField('profiles', 'user_id', user.id);
      user.profile = profile;
    }

    // Get total count
    const totalUsers = await db.query('users', { select: 'count' });
    const totalCount = totalUsers.length;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user profile by ID
router.get('/:id', optionalAuth, validateId, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user profile
    const profile = await db.findByField('profiles', 'user_id', userId);
    
    // Get user settings
    const settings = await db.findByField('user_settings', 'user_id', userId);

    // Get user's posts count
    const posts = await db.query('posts', {
      where: { user_id: userId },
      select: 'count'
    });
    const postsCount = posts.length;

    // Get user's friends count
    const friendships = await db.query('friendships', {
      where: { user_id: userId, status: 'accepted' },
      select: 'count'
    });
    const friendsCount = friendships.length;

    // Check if current user is friends with this user
    let isFriend = false;
    let friendshipStatus = null;
    if (req.user && req.user.id !== userId) {
      const friendship = await db.query('friendships', {
        where: { user_id: req.user.id, friend_id: userId }
      });
      
      if (friendship.length > 0) {
        friendshipStatus = friendship[0].status;
        isFriend = friendship[0].status === 'accepted';
      }
    }

    // Remove sensitive information
    delete user.password_hash;
    delete user.verification_token;

    const userData = {
      ...user,
      profile,
      settings,
      stats: {
        posts: postsCount,
        friends: friendsCount
      },
      friendship: {
        isFriend,
        status: friendshipStatus
      }
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.put('/:id/profile', authenticateToken, validateId, validateProfileUpdate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    // Check if user is updating their own profile or is admin
    if (userId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const {
      fullName,
      bio,
      location,
      website,
      gender,
      privacy,
      birthday
    } = req.body;

    // Check if profile exists
    let profile = await db.findByField('profiles', 'user_id', userId);
    
    const profileData = {
      full_name: fullName,
      bio,
      location,
      website,
      gender,
      privacy,
      birthday,
      updated_at: new Date().toISOString()
    };

    if (profile) {
      // Update existing profile
      profile = await db.update('profiles', profile.id, profileData);
    } else {
      // Create new profile
      profileData.user_id = userId;
      profile = await db.insert('profiles', profileData);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get user's posts
router.get('/:id/posts', optionalAuth, validateId, validatePagination, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts
    const posts = await db.query('posts', {
      where: { user_id: userId },
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    });

    // Get total count
    const totalPosts = await db.query('posts', {
      where: { user_id: userId },
      select: 'count'
    });
    const totalCount = totalPosts.length;

    // Check if current user liked each post
    if (req.user) {
      for (let post of posts) {
        const like = await db.query('likes', {
          where: { user_id: req.user.id, post_id: post.id }
        });
        post.is_liked = like.length > 0;
      }
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts'
    });
  }
});

// Get user's friends
router.get('/:id/friends', optionalAuth, validateId, validatePagination, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's accepted friendships
    const friendships = await db.query('friendships', {
      where: { user_id: userId, status: 'accepted' },
      limit,
      offset
    });

    // Get friend details
    const friends = [];
    for (let friendship of friendships) {
      const friend = await db.findById('users', friendship.friend_id);
      const profile = await db.findByField('profiles', 'user_id', friendship.friend_id);
      
      if (friend) {
        delete friend.password_hash;
        friends.push({
          ...friend,
          profile,
          friendship_since: friendship.accepted_at
        });
      }
    }

    // Get total count
    const totalFriendships = await db.query('friendships', {
      where: { user_id: userId, status: 'accepted' },
      select: 'count'
    });
    const totalCount = totalFriendships.length;

    res.json({
      success: true,
      data: {
        friends,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user friends'
    });
  }
});

// Send friend request
router.post('/:id/friend-request', authenticateToken, validateId, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    // Can't send friend request to yourself
    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await db.findById('users', targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await db.query('friendships', {
      where: { user_id: currentUserId, friend_id: targetUserId }
    });

    if (existingFriendship.length > 0) {
      const friendship = existingFriendship[0];
      
      if (friendship.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Friend request already sent'
        });
      } else if (friendship.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You are already friends'
        });
      } else if (friendship.status === 'blocked') {
        return res.status(400).json({
          success: false,
          message: 'Cannot send friend request to blocked user'
        });
      }
    }

    // Create friend request
    await db.insert('friendships', {
      user_id: currentUserId,
      friend_id: targetUserId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }
});

// Accept/Reject friend request
router.put('/:id/friend-request', authenticateToken, validateId, async (req, res) => {
  try {
    const requesterId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"'
      });
    }

    // Check if friend request exists
    const friendship = await db.query('friendships', {
      where: { user_id: requesterId, friend_id: currentUserId, status: 'pending' }
    });

    if (friendship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (action === 'accept') {
      // Accept friend request
      await db.update('friendships', friendship[0].id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Friend request accepted'
      });
    } else {
      // Reject friend request (delete it)
      await db.delete('friendships', friendship[0].id);

      res.json({
        success: true,
        message: 'Friend request rejected'
      });
    }
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle friend request'
    });
  }
});

// Remove friend
router.delete('/:id/friend', authenticateToken, validateId, async (req, res) => {
  try {
    const friendId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    // Check if friendship exists
    const friendship = await db.query('friendships', {
      where: { user_id: currentUserId, friend_id: friendId, status: 'accepted' }
    });

    if (friendship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    // Remove friendship
    await db.delete('friendships', friendship[0].id);

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove friend'
    });
  }
});

module.exports = router;
