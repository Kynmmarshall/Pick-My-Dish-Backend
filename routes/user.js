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
router.put('/profile-picture', async (req, res) => {
  try {
    const { userId, imagePath } = req.body;
    
    await db.execute(
      'UPDATE users SET profile_image_path = ? WHERE id = ?',
      [imagePath, userId]
    );
    
    res.json({ message: 'Profile picture updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

module.exports = router;