const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer'); 
const path = require('path');     


// Configure multer for file uploads 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profile-pictures'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// Get user profile
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

// Update user profile
router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint' });
});

// UPDATE USERNAME 
router.put('/username', async (req, res) => {
  try {
    const { username, userId } = req.body;  // ← Get userId from request
    
    console.log('🔄 Updating username for user $userId to: $username');

    await db.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]   // ← Use userId in query
    );
    
    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    console.log('❌ Database error: $error');
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// UPDATE user profile picture
router.put('/profile-picture', upload.single('image'), async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = req.file.path.replace(/^.*[\\\/]uploads[\\\/]/, 'uploads/');
    
    await db.execute(
      'UPDATE users SET profile_image_path = ? WHERE id = ?',
      [imagePath, userId]
    );
    
    res.json({ 
      message: 'Profile picture updated',
      imagePath: imagePath
    });
  } catch (error) {
    console.error('Profile picture error:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// GET user profile picture
router.get('/profile-picture', async (req, res) => {
  try {
    const userId = req.query.userId; // Get from query parameter
    
    const [users] = await db.execute(
      'SELECT profile_image_path FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    if (user.profile_image_path) {
      res.json({ imagePath: user.profile_image_path.replace(/^.*[\\\/]uploads[\\\/]/, 'uploads/') });
    } else {
      res.json({ imagePath: 'assets/login/noPicture.png' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile picture' });
  }
});

module.exports = router;