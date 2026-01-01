const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer'); 
const path = require('path');     
const { auth } = require('../middleware/auth');

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
router.get('/profile', auth, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

// Update user profile
router.put('/profile', auth, (req, res) => {
  res.json({ message: 'Update profile endpoint' });
});

// UPDATE USERNAME 
router.put('/username', auth, async (req, res) => {
  try {
    const { username } = req.body;  // ← Get username from request
    const userId = req.user.id; // From auth middleware
    
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
router.put('/profile-picture', auth, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware    
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
router.get('/profile-picture', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Get from auth middleware
    
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

// GET user's favorite recipes
router.get('/:userId/favorites', auth, async (req, res) => {
  console.log('📥 GET /favorites - Request received');
  console.log('👤 User ID:', req.params.userId);
  console.log('⏰ Time:', new Date().toISOString());
  
  try {
    const userId = req.user.Id;
    
    if (!userId || userId === '0') {
      console.log('❌ Invalid user ID received:', userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log('🔍 Fetching favorites for user:', userId);
    console.log('📊 Executing SQL query...');
    
    const [favorites] = await db.execute(`
      SELECT r.*, 
        c.name as category_name,
        GROUP_CONCAT(DISTINCT i.name) as ingredient_names,
        MAX(uf.created_at) as favorite_date
      FROM user_favorites uf
      JOIN recipes r ON uf.recipe_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE uf.user_id = ?
      GROUP BY r.id, r.name, r.user_id, r.category_id, r.emotions, r.cooking_time, 
              r.calories, r.image_path, r.steps, r.created_at, r.updated_at,
              c.name
      ORDER BY MAX(uf.created_at) DESC
    `, [userId]);
    
    console.log('✅ SQL query executed successfully');
    console.log('📈 Number of favorites found:', favorites.length);
    
    if (favorites.length > 0) {
      console.log('📋 Sample favorite recipes:');
      favorites.slice(0, 3).forEach((fav, index) => {
        console.log(`  ${index + 1}. ID: ${fav.id}, Name: "${fav.name}", Ingredients: ${fav.ingredient_names || 'none'}`);
      });
    } else {
      console.log('📭 No favorites found for this user');
    }
    
    console.log('📤 Sending response...');
    res.json({ favorites });
    console.log('✅ Response sent successfully');
    
  } catch (error) {
    console.error('❌ ERROR fetching favorites:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    console.error('📝 SQL that caused error:', error.sql);
    
    // Send detailed error for debugging
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST add favorite recipe
router.post('/favorites', auth, async (req, res) => {
  console.log('📥 POST /favorites - Request received');
  console.log('📦 Request body:', JSON.stringify(req.body));
  console.log('⏰ Time:', new Date().toISOString());
  
  try {
    const { recipeId } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!userId || !recipeId) {
      console.log('❌ Missing parameters:', { userId, recipeId });
      return res.status(400).json({ error: 'Missing userId or recipeId' });
    }
    
    console.log(`🔍 Adding favorite - User: ${userId}, Recipe: ${recipeId}`);
    
    // Check if already favorited
    console.log('🔎 Checking if recipe already favorited...');
    const [existing] = await db.execute(
      'SELECT * FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );
    
    if (existing.length > 0) {
      console.log('⚠️ Recipe already in favorites - skipping');
      return res.status(400).json({ error: 'Recipe already in favorites' });
    }
    
    console.log('📝 Inserting into user_favorites table...');
    const result = await db.execute(
      'INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)',
      [userId, recipeId]
    );
    
    console.log('✅ Favorite added successfully');
    console.log('📊 Insert result:', {
      insertId: result[0]?.insertId,
      affectedRows: result[0]?.affectedRows
    });
    
    // Verify the insert
    console.log('🔍 Verifying insertion...');
    const [verify] = await db.execute(
      'SELECT * FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );
    
    if (verify.length > 0) {
      console.log('✅ Verification passed - favorite exists in database');
    } else {
      console.log('❌ Verification failed - favorite not found after insert');
    }
    
    res.status(201).json({ 
      message: 'Recipe added to favorites',
      favoriteId: result[0]?.insertId 
    });
    
    console.log('📤 Response sent');
    
  } catch (error) {
    console.error('❌ ERROR adding favorite:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Check if it's a foreign key constraint error
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.error('🔗 Foreign key error - user or recipe might not exist');
      return res.status(404).json({ error: 'User or recipe not found' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE remove favorite recipe
router.delete('/favorites', auth, async (req, res) => {
  console.log('📥 DELETE /favorites - Request received');
  console.log('📦 Request body:', JSON.stringify(req.body));
  console.log('⏰ Time:', new Date().toISOString());
  
  try {
    const { recipeId } = req.body;
    const userId = req.user.id; // From auth middleware
    
    if (!userId || !recipeId) {
      console.log('❌ Missing parameters:', { userId, recipeId });
      return res.status(400).json({ error: 'Missing userId or recipeId' });
    }
    
    console.log(`🔍 Removing favorite - User: ${userId}, Recipe: ${recipeId}`);
    
    // Check if exists before deleting
    console.log('🔎 Checking if favorite exists...');
    const [existing] = await db.execute(
      'SELECT * FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );
    
    if (existing.length === 0) {
      console.log('⚠️ Favorite not found - nothing to delete');
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    console.log('🗑️ Deleting from user_favorites table...');
    const result = await db.execute(
      'DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );
    
    console.log('✅ Favorite removed successfully');
    console.log('📊 Delete result:', {
      affectedRows: result[0]?.affectedRows
    });
    
    // Verify the deletion
    console.log('🔍 Verifying deletion...');
    const [verify] = await db.execute(
      'SELECT * FROM user_favorites WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );
    
    if (verify.length === 0) {
      console.log('✅ Verification passed - favorite removed from database');
    } else {
      console.log('❌ Verification failed - favorite still exists');
    }
    
    res.json({ 
      message: 'Recipe removed from favorites',
      deleted: result[0]?.affectedRows > 0
    });
    
    console.log('📤 Response sent');
    
  } catch (error) {
    console.error('❌ ERROR removing favorite:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ADD THIS HELPER ENDPOINT FOR DEBUGGING
router.get('/debug/favorites/:userId', auth, async (req, res) => {
  console.log('🐛 DEBUG /favorites endpoint called for user:', req.user.id);
  console.log('⏰ Time:', new Date().toISOString());
  try {
    const userId = req.user.id;
    
    // Check user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    console.log('👤 User exists:', users.length > 0 ? 'Yes' : 'No');
    
    if (users.length === 0) {
      return res.json({ error: 'User not found', userId });
    }
    
    // Check all favorites for this user (simple query)
    const [allFavorites] = await db.execute(
      'SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('📊 Raw favorites count:', allFavorites.length);
    console.log('📋 Raw favorites:', allFavorites);
    
    // Check each recipe exists
    const recipeChecks = [];
    for (const fav of allFavorites) {
      const [recipes] = await db.execute('SELECT id, name FROM recipes WHERE id = ?', [fav.recipe_id]);
      recipeChecks.push({
        favorite_id: fav.id,
        recipe_id: fav.recipe_id,
        recipe_exists: recipes.length > 0,
        recipe_name: recipes.length > 0 ? recipes[0].name : 'NOT FOUND',
        created_at: fav.created_at
      });
    }
    
    res.json({
      userId,
      user: users[0],
      rawFavorites: allFavorites,
      recipeChecks,
      summary: {
        totalFavorites: allFavorites.length,
        validRecipes: recipeChecks.filter(r => r.recipe_exists).length,
        invalidRecipes: recipeChecks.filter(r => !r.recipe_exists).length
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// check if user is admin
router.get('/:userId/is-admin', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    res.json({ isAdmin: user?.is_admin || false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;