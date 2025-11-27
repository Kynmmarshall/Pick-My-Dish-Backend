const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
    const { username } = req.body;
    const userId = 1; // TODO: Get from JWT token later
    
    await db.execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]
    );
    
    res.json({ message: 'Username updated successfully' });
  } catch (error) {
    console.error('Username update error:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

module.exports = router;