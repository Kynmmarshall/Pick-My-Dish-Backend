const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kynmmarshall',
  password: process.env.DB_PASSWORD || 'Kamdeu2007....',
  database: process.env.DB_NAME || 'pick_my_dish',
  port: process.env.DB_PORT || 3306
});

console.log('Testing database connection...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed: ' + err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database as id ' + connection.threadId);
  
  // Test query
  connection.query('SELECT * FROM categories', (err, results) => {
    if (err) {
      console.error('❌ Query failed: ' + err.message);
    } else {
      console.log('✅ Categories table test successful!');
      console.log('Sample data:', results);
    }
    
    connection.end();
    console.log('✅ Database test completed!');
  });
});
