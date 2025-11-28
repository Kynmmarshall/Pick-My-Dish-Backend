const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

// Update user profile
router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint' });
});

// UPDATE USERNAME - ADD THIS
router.put('/username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id; // From JWT token
    
    console.log('🔄 Updating username for user:', userId, 'to:', username);
    
    const [result] = await db.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    console.error('❌ Username update error:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

module.exports = router;