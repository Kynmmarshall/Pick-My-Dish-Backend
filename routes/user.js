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

// UPDATE USERNAME - ADD THIS
router.put('/username', async (req, res) => {
  try {
    const { username, userId } = req.body;  // ← Get userId from request
    
    debugPrint('🔄 Updating username for user $userId to: $username');

    await db.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]   // ← Use userId in query
    );
    
    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    debugPrint('❌ Database error: $error');
    res.status(500).json({ error: 'Failed to update username' });
  }
});

module.exports = router;