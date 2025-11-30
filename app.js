const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pick My Dish API is running!',
    endpoints: {
      auth: '/api/auth',
      test: '/api/pick_my_dish'
    }
  });
});

// Test database connection
app.get('/api/pick_my_dish', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM categories');  // NEW WAY
    res.json({ message: 'Database connected!', categories: results });
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

module.exports = app;