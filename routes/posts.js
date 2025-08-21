const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePost, validateComment, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all posts (with pagination and filtering)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const groupId = req.query.groupId;
    const userId = req.query.userId;

    let queryOptions = {
      select: `
        *,
        users!posts_user_id_fkey(username, profiles!profiles_user_id_fkey(full_name, avatar_url)),
        groups!posts_group_id_fkey(name, description),
        comments!comments_post_id_fkey(count),
        likes!likes_post_id_fkey(count)
      `,
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    };

    // Add filters
    if (groupId) {
      queryOptions.where = { group_id: groupId };
    }
    if (userId) {
      queryOptions.where = { user_id: userId };
    }

    // Get posts
    const posts = await db.query('posts', queryOptions);

    // Get total count for pagination
    let countQuery = { select: 'count' };
    if (groupId) countQuery.where = { group_id: groupId };
    if (userId) countQuery.where = { user_id: userId };
    
    const totalPosts = await db.query('posts', countQuery);
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
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
});

// Get single post
router.get('/:id', optionalAuth, validateId, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get post author
    const author = await db.findById('users', post.user_id);
    const profile = await db.findByField('profiles', 'user_id', post.user_id);

    // Get group if post is in a group
    let group = null;
    if (post.group_id) {
      group = await db.findById('groups', post.group_id);
    }

    // Get comments
    const comments = await db.query('comments', {
      where: { post_id: postId },
      orderBy: { column: 'created_at', ascending: true }
    });

    // Get comment authors
    for (let comment of comments) {
      const commentAuthor = await db.findById('users', comment.user_id);
      const commentProfile = await db.findByField('profiles', 'user_id', comment.user_id);
      comment.author = {
        ...commentAuthor,
        profile: commentProfile
      };
      delete comment.author.password_hash;
    }

    // Check if current user liked the post
    let isLiked = false;
    if (req.user) {
      const like = await db.query('likes', {
        where: { user_id: req.user.id, post_id: postId }
      });
      isLiked = like.length > 0;
    }

    const postData = {
      ...post,
      author: {
        ...author,
        profile
      },
      group,
      comments,
      is_liked: isLiked
    };

    delete postData.author.password_hash;

    res.json({
      success: true,
      data: postData
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
});

// Create new post
router.post('/', authenticateToken, validatePost, async (req, res) => {
  try {
    const { content, privacy, groupId } = req.body;
    const userId = req.user.id;

    // Check if user is member of the group if posting to a group
    if (groupId) {
      const membership = await db.query('group_memberships', {
        where: { user_id: userId, group_id: groupId }
      });
      
      if (membership.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of the group to post'
        });
      }
    }

    const postData = {
      user_id: userId,
      content: content || null,
      privacy: privacy || 'public',
      group_id: groupId || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    };

    const post = await db.insert('posts', postData);

    // Get post with author info
    const author = await db.findById('users', userId);
    const profile = await db.findByField('profiles', 'user_id', userId);

    const postWithAuthor = {
      ...post,
      author: {
        ...author,
        profile
      }
    };

    delete postWithAuthor.author.password_hash;

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: postWithAuthor
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

// Update post
router.put('/:id', authenticateToken, validateId, validatePost, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content, privacy } = req.body;
    const userId = req.user.id;

    // Get post
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const updateData = {
      content: content || null,
      privacy: privacy || post.privacy,
      updated_at: new Date().toISOString()
    };

    const updatedPost = await db.update('posts', postId, updateData);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

// Delete post
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get post
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin/moderator
    if (post.user_id !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await db.delete('posts', postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, validateId, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked the post
    const existingLike = await db.query('likes', {
      where: { user_id: userId, post_id: postId }
    });

    if (existingLike.length > 0) {
      // Unlike
      await db.query('likes', {
        where: { user_id: userId, post_id: postId }
      });
      
      // Decrease like count
      await db.update('posts', postId, {
        likes_count: Math.max(0, post.likes_count - 1)
      });

      res.json({
        success: true,
        message: 'Post unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await db.insert('likes', {
        user_id: userId,
        post_id: postId
      });

      // Increase like count
      await db.update('posts', postId, {
        likes_count: post.likes_count + 1
      });

      res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true }
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike post'
    });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, validateId, validateComment, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const commentData = {
      post_id: postId,
      user_id: userId,
      content,
      likes_count: 0
    };

    const comment = await db.insert('comments', commentData);

    // Increase comment count on post
    await db.update('posts', postId, {
      comments_count: post.comments_count + 1
    });

    // Get comment with author info
    const author = await db.findById('users', userId);
    const profile = await db.findByField('profiles', 'user_id', userId);

    const commentWithAuthor = {
      ...comment,
      author: {
        ...author,
        profile
      }
    };

    delete commentWithAuthor.author.password_hash;

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: commentWithAuthor
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Get comments for a post
router.get('/:id/comments', optionalAuth, validateId, validatePagination, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await db.query('comments', {
      where: { post_id: postId },
      orderBy: { column: 'created_at', ascending: true },
      limit,
      offset
    });

    // Get comment authors
    for (let comment of comments) {
      const author = await db.findById('users', comment.user_id);
      const profile = await db.findByField('profiles', 'user_id', comment.user_id);
      comment.author = {
        ...author,
        profile
      };
      delete comment.author.password_hash;
    }

    // Get total count
    const totalComments = await db.query('comments', {
      where: { post_id: postId },
      select: 'count'
    });
    const totalCount = totalComments.length;

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

module.exports = router;
