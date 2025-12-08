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
    const { 
      name, 
      category, // Category name (e.g., "Breakfast")
      time, 
      calories, 
      ingredients, // Array of ingredient IDs
      instructions, // Array of strings
      emotions, // Array of strings
      userId 
    } = req.body;
    
    // 1. Find category ID
    const [categoryResult] = await db.execute(
      'SELECT id FROM categories WHERE name = ?',
      [category]
    );
    const categoryId = categoryResult[0]?.id || 1; // Default to Breakfast
    
    // 2. Insert recipe
    const [recipeResult] = await db.execute(
      `INSERT INTO recipes 
        (user_id, name, category_id, cooking_time, calories, 
         steps, emotions, image_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        name, 
        categoryId, 
        time, 
        calories, 
        JSON.stringify(instructions || []),
        JSON.stringify(emotions || []),
        req.file ? req.file.path : null
      ]
    );
    
    // 3. Insert into recipe_ingredients table
    if (ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        await db.execute(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id) VALUES (?, ?)',
          [recipeResult.insertId, ingredient]
        );
      }
    }
    
    res.status(201).json({ 
      success: true, 
      recipeId: recipeResult.insertId 
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/recipes - Get all recipes (simplified)
router.get('/recipes', async (req, res) => {
  try {
    console.log('📋 Fetching all recipes');
    
    const [recipes] = await db.execute(`
      SELECT 
        r.id,
        r.name,
        r.cooking_time,
        r.calories,
        r.image_path,
        r.emotions,
        r.steps,
        r.user_id,
        c.name as category_name,
        GROUP_CONCAT(i.name) as ingredient_names,
        u.username as author_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      LEFT JOIN users u ON r.user_id = u.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    
    console.log(`✅ Found ${recipes.length} recipes`);
    
    // Send raw data - let Flutter handle parsing
    res.json({ 
      success: true, 
      count: recipes.length,
      recipes: recipes  // Send as-is
    });
    
  } catch (error) {
    console.error('❌ Get recipes error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/ingredients - For dropdown in app
router.get('/ingredients', async (req, res) => {
  try {
    const [ingredients] = await db.execute('SELECT id, name FROM ingredients ORDER BY name');
    res.json({ success: true, ingredients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories - For dropdown
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT id, name FROM categories ORDER BY name');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;