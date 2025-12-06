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
    
    // Just return hardcoded data for testing
    const hardcodedRecipes = [
      {
        id: 1,
        name: 'Toast with Berries',
        category: 'Breakfast',
        time: '10 mins',
        calories: '250',
        image_path: 'uploads/recipes-pictures/toast_berries.png',
        ingredients: ['Bread', 'Berries'],
        instructions: ['Toast bread', 'Add berries', 'Serve'],
        mood: ['Quick', 'Light', 'Happy'],
        userId: 13,
        isFavorite: false
      },
      {
        id: 2,
        name: 'Chicken Burger',
        category: 'Dinner',
        time: '25 mins',
        calories: '450',
        image_path: 'uploads/recipes-pictures/chicken_burger.png',
        ingredients: ['Chicken', 'Bread', 'Vegetables'],
        instructions: ['Grill chicken', 'Toast bun', 'Assemble'],
        mood: ['Energetic', 'Comfort', 'Happy'],
        userId: 13,
        isFavorite: false
      }
    ];
    
    res.json({ 
      success: true, 
      count: hardcodedRecipes.length,
      recipes: hardcodedRecipes 
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