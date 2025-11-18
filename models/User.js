const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { username, email, password, full_name } = userData;
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (username, email, password_hash, full_name) 
      VALUES (?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [username, email, hashedPassword, full_name], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    
    return new Promise((resolve, reject) => {
      db.query(query, [email], (err, results) => {
        if (err) reject(err);
        resolve(results[0]); // Return first user found
      });
    });
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    
    return new Promise((resolve, reject) => {
      db.query(query, [username], (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;