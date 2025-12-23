const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const fs = require('fs');

// Configure multer for recipe pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/recipes-pictures/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// check if user owns the recipe or is admin
const checkRecipeOwnership = async (req, res, next) => {
  try {
    const recipeId = req.params.id || req.params.recipeId;
    const { userId } = req.body;
    
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const user = await User.findByPk(userId);
    const isAdmin = user?.is_admin || false;
    
    // If user is admin, allow all operations
    if (isAdmin) {
      req.isAdmin = true;
      req.recipe = recipe;
      return next();
    }
    
    // Check if user owns the recipe
    if (recipe.user_id != userId) {
      return res.status(403).json({ error: 'Not authorized to modify this recipe' });
    }
    
    req.isAdmin = false;
    req.recipe = recipe;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add proper file filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp','image/heic','image/heif','image/tiff','application/octet-stream' ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  //fileFilter: fileFilter, // Add this
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// 1. POST /api/recipes - Create recipe with picture
router.post('/recipes', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Received form data:', req.body);
    // 1. Get all fields from req.body
    const { 
      name, 
      category,
      time, 
      calories, 
      ingredients: ingredientsJson,  // Rename to indicate it's JSON string
      instructions: instructionsJson,
      emotions: emotionsJson,
      userId 
    } = req.body;
    
    // 2. PARSE THE JSON STRINGS HERE
    let ingredients = [];
    let instructions = [];
    let emotions = [];
    
    try {
      ingredients = ingredientsJson ? JSON.parse(ingredientsJson) : [];
      instructions = instructionsJson ? JSON.parse(instructionsJson) : [];
      emotions = emotionsJson ? JSON.parse(emotionsJson) : [];
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError.message);
      return res.status(400).json({ 
        error: 'Invalid JSON data',
        details: parseError.message 
      });
    }

    console.log('Parsed data:');
    console.log('Ingredients:', ingredients);
    console.log('Emotions:', emotions);
    console.log('Instructions:', instructions);
    
    // 3. Find category ID
    const [categoryResult] = await db.execute(
      'SELECT id FROM categories WHERE name = ?',
      [category]
    );
    const categoryId = categoryResult[0]?.id || 1;

    // 4. Insert recipe
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
        JSON.stringify(instructions),
        JSON.stringify(emotions),
        req.file ? req.file.path : null
      ]
    );
    
    console.log('✅ Recipe inserted with ID:', recipeResult.insertId);
    console.log('📦 Ingredients to insert:', ingredients);

    // 5. Insert into recipe_ingredients table
    if (ingredients && ingredients.length > 0) {
      console.log('Inserting', ingredients.length, 'ingredients');
      for (const ingredientId of ingredients) {
        console.log('Inserting ingredient ID:', ingredientId);
        await db.execute(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id) VALUES (?, ?)',
          [recipeResult.insertId, ingredientId]
        );
      }
      console.log('✅ All ingredients inserted');
    } else {
      console.log('⚠️ No ingredients to insert');
    }
    
    res.status(201).json({ 
      success: true, 
      recipeId: recipeResult.insertId,
      message: 'Recipe uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs'
    });
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

//endpoint for adding ingredients
router.post('/ingredients', async (req, res) => {
  try {
    const { name } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO ingredients (name) VALUES (?)',
      [name]
    );
    
    res.status(201).json({ 
      success: true, 
      ingredientId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recipes/with-permissions?userId= - Get recipes with edit/delete permissions
router.get('/with-permissions', async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findByPk(userId);
    const isAdmin = user?.is_admin || false;
    
    const recipes = await Recipe.findAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'username'] },
        { model: Category, attributes: ['name'] }
      ]
    });
    
    const recipesWithPermissions = recipes.map(recipe => ({
      ...recipe.toJSON(),
      canEdit: isAdmin || recipe.user_id == userId,
      canDelete: isAdmin || recipe.user_id == userId,
    }));
    
    res.json({ recipes: recipesWithPermissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Replace your current DELETE /:id route with:
router.delete('/:id', checkRecipeOwnership, async (req, res) => {
  try {
    await req.recipe.destroy();
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Replace your current PUT /:id route with:
router.put('/:id', checkRecipeOwnership, async (req, res) => {
  console.log('📥 PUT /recipes/:id called');
  console.log('   Recipe ID:', req.params.id);
  console.log('   User ID:', req.body.userId);
  console.log('   Body:', req.body);
  try {
    const { name, category, time, calories, ingredients, instructions, emotions } = req.body;
    
    // Update recipe
    await req.recipe.update({
      name,
      category_id: category, // or however you handle category
      cooking_time: time,
      calories,
      steps: instructions,
      emotions
    });
    
    // Update ingredients if provided
    if (ingredients) {
      await RecipeIngredient.destroy({ where: { recipe_id: req.recipe.id } });
      const ingredientPromises = ingredients.map(ingId => 
        RecipeIngredient.create({ recipe_id: req.recipe.id, ingredient_id: ingId })
      );
      await Promise.all(ingredientPromises);
      }
      
      res.json({ message: 'Recipe updated successfully', recipe: req.recipe });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
module.exports = router;