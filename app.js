const express = require('express');
const cors = require('cors');
require('./config/database'); // Database connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Pick My Dish API is running!' });
});

// Test database route
app.get('/api/test-db', (req, res) => {
  const db = require('./config/database');
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ categories: results });
  });
});

module.exports = app;