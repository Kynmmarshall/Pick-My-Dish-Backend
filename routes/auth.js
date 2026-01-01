const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('📝 REGISTER REQUEST RECEIVED:', req.body);
  
  try {
    const { userName, email, password } = req.body;
    
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
    
    console.log('👤 Creating new user:', { userName, email });
    
    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [userName, email, passwordHash]
    );
    
    // Create JWT token
    const payload = {
      user: {
        id: result.insertId,
        username: userName,
        email: email
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ USER CREATED SUCCESSFULLY - ID:', result.insertId);
    res.status(201).json({ 
      message: 'User created', 
      userId: result.insertId,
      token,
      user: {
        id: result.insertId,
        username: userName,
        email: email
      }
    });
    
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
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    console.log('📊 Users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ INVALID CREDENTIALS for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('❌ INVALID PASSWORD for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ LOGIN SUCCESSFUL for user:', user.username);
    console.log('📋 User details:', { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      profile_image_path: user.profile_image_path,
      created_at: user.created_at  
    });
    
    res.json({ 
      message: 'Login successful', 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_image_path: user.profile_image_path,
        created_at: user.created_at,
        is_admin: user.is_admin || false
      }, 
      token,
      userId: user.id 
    });
    
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    console.error('Full error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify - Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [decoded.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_image_path: user.profile_image_path,
        created_at: user.created_at,
        is_admin: user.is_admin || false
      },
      valid: true
    });
    
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

module.exports = router;