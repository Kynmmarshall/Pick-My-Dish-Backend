const bcrypt = require('bcryptjs');
const db = require('./config/database');

const users = [
  { email: 'kynmmarshall@gmail.com', password: 'Password' },
  { email: 'peter@ictunibersity.edu.cm', password: 'Peter123' },
  { email: 'John@ictuniversity.edu.cm', password: 'John1234' },
  { email: 'rayan@gmail.com', password: 'Rayan123' },
  { email: 'user1@example.com', password: 'passwffdfd23' },
  { email: 'andynadrie@gmail.com', password: 'DEMONBLEACHING237' },
  { email: 'nadaljunior999@gmail.com', password: 'Fahdil@1' },
  { email: 'AZERTY@GMAIL.COM', password: 'AZERTYUI@' },
  { email: 'pyth@gmail.com', password: 'Pass1234' },
  { email: 'test@test.com', password: 'test' },
  { email: 'test@example.com', password: 'password123' },
  { email: 'vanbrown920@gmail.com', password: 'Vanbrown2006.' },
  { email: 'biovitalis49@gmail.com', password: 'y@ungnigg@' },
  { email: 'jaysondjemsjayson@gmail.com', password: 'J14s03d2006' }
];

async function hashPasswords() {
  for (const user of users) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, user.email]
    );
    
    console.log(`Hashed password for ${user.email}`);
  }
  console.log('All passwords hashed!');
  process.exit(0);
}

hashPasswords().catch(console.error);