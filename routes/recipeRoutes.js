const express = require('express');
const router = express.Router();

// Get all recipes
router.get('/', (req, res) => {
  res.json({ message: 'All recipes endpoint' });
});

// Get recipes by emotion
router.get('/emotion/:emotion', (req, res) => {
  const { emotion } = req.params;
  res.json({ message: `Recipes for emotion: ${emotion}` });
});

// Search recipes
router.get('/search', (req, res) => {
  const { q } = req.query;
  res.json({ message: `Search results for: ${q}` });
});

// Get favorite recipes
router.get('/favorites', (req, res) => {
  res.json({ message: 'Favorite recipes endpoint' });
});

module.exports = router;