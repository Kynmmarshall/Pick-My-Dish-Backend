const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const fs = require('fs');

// Configure multer for recipe pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory if it doesn't exist
    const uploadDir = 'uploads/recipes-pictures/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `recipe-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// 1. POST /api/recipes - Create recipe with picture
router.post('/recipes', upload.single('picture'), async (req, res) => {
  try {
    console.log('📝 Creating new recipe:', req.body);
    console.log('📸 File received:', req.file ? 'Yes' : 'No');
    
    const { 
      name, 
      category, 
      time, 
      calories, 
      ingredients, 
      instructions, 
      userId 
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !userId) {
      return res.status(400).json({ error: 'Name, category, and userId are required' });
    }
    
    let picturePath = null;
    if (req.file) {
      // Store relative path
      picturePath = req.file.path.replace(/^.*[\\\/]uploads[\\\/]/, 'uploads/');
      console.log('🖼️ Picture saved at:', picturePath);
    }
    
    // Convert arrays to JSON strings for database storage
    const ingredientsJson = Array.isArray(ingredients) 
      ? JSON.stringify(ingredients) 
      : ingredients;
    
    const instructionsJson = Array.isArray(instructions) 
      ? JSON.stringify(instructions) 
      : instructions;
    
    const [result] = await db.execute(
      `INSERT INTO recipes (user_id, name, category_id, cooking_time, calories, ingredients, instructions, image_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        name, 
        category, 
        time || null, 
        calories || null, 
        ingredientsJson || null, 
        instructionsJson || null, 
        picturePath
      ]
    );
    
    console.log('✅ Recipe created with ID:', result.insertId);
    
    res.status(201).json({ 
      success: true,
      message: 'Recipe created successfully', 
      recipeId: result.insertId,
      picturePath: picturePath 
    });
    
  } catch (error) {
    console.error('❌ Recipe creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create recipe',
      details: error.message 
    });
  }
});

// 2. GET /api/recipes - Get all recipes (simplified)
router.get('/recipes', async (req, res) => {
  try {
    console.log('📋 Fetching all recipes');
    
    // Simple query to get all recipes
    const [recipes] = await db.execute(`
      SELECT 
        r.*,
        c.name as category_name,
        u.username as author_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    
    console.log(`✅ Found ${recipes.length} recipes`);
    
    // Return recipes as-is for now
    res.json({ 
      success: true,
      count: recipes.length,
      recipes: recipes 
    });
    
  } catch (error) {
    console.error('❌ Get recipes error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recipes',
      details: error.message 
    });
  }
});


module.exports = router;