const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('📝 REGISTER REQUEST RECEIVED:', req.body);
  
  try {
    const { fullName, email, password } = req.body;
    
    console.log('🔍 Checking if user exists:', email);
    // Check if user exists
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );
    
    console.log('📊 Existing users found:', existing.length);
    
    if (existing.length > 0) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }
    
    console.log('👤 Creating new user:', { fullName, email });
    // Create user (in real app, hash password!)
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [email.split('@')[0], email, password, fullName]
    );
    
    console.log('✅ USER CREATED SUCCESSFULLY - ID:', result.insertId);
    res.status(201).json({ message: 'User created', userId: result.insertId });
    
  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error.message);
    console.error('Full error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Querying database for user:', email);
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND password_hash = ?',
      [email, password]
    );
    
    console.log('📊 Users found with credentials:', users.length);
    
    if (users.length === 0) {
      console.log('❌ INVALID CREDENTIALS for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ LOGIN SUCCESSFUL for user:', users[0].username);
    console.log('📋 User details:', { 
      id: users[0].id, 
      username: users[0].username, 
      email: users[0].email 
    });
    
    res.json({ message: 'Login successful', user: users[0] });
    
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    console.error('Full error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;