const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;
    const originalName = req.file.originalname;

    // Process image with Sharp (resize, optimize)
    const processedFilename = `processed_${filename}`;
    const processedPath = path.join(uploadsDir, processedFilename);

    await sharp(originalPath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(processedPath);

    // Delete original file
    fs.unlinkSync(originalPath);

    // Generate thumbnail
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

    await sharp(processedPath)
      .resize(200, 200, { 
        fit: 'cover' 
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    const imageUrl = `/uploads/${processedFilename}`;
    const thumbnailUrl = `/uploads/${thumbnailFilename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: processedFilename,
        originalName: originalName,
        url: imageUrl,
        thumbnailUrl: thumbnailUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Error uploading image'
    });
  }
});

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No avatar file provided'
      });
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;

    // Process avatar with Sharp (square crop, resize)
    const processedFilename = `avatar_${filename}`;
    const processedPath = path.join(uploadsDir, processedFilename);

    await sharp(originalPath)
      .resize(300, 300, { 
        fit: 'cover' 
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Delete original file
    fs.unlinkSync(originalPath);

    const avatarUrl = `/uploads/${processedFilename}`;

    // Update user's avatar in database
    const { query } = require('../config/database');
    await query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, req.user.id]
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        filename: processedFilename,
        url: avatarUrl
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Error uploading avatar'
    });
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private
router.delete('/:filename', protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // Also try to delete thumbnail if it exists
    const thumbnailPath = path.join(uploadsDir, `thumb_${filename}`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting file'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
});

module.exports = router;
