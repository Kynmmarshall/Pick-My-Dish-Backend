const express = require('express');
const router = express.Router();
const db = require('../config/database');
//const auth = require('../middleware/auth');

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
    const { email } = req.body; // Send user's email from Flutter
    
    // Get user ID from email
    const [users] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length == 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = users[0].id;
    const imagePath = req.file.path;
    
    await db.execute(
      'UPDATE users SET profile_image_path = ? WHERE id = ?',
      [imagePath, userId]
    );
    
    res.json({ message: 'Profile picture updated', imagePath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

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
      res.json({ imagePath: user.profile_image_path });
    } else {
      res.json({ imagePath: 'assets/login/noPicture.png' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile picture' });
  }
});

module.exports = router;