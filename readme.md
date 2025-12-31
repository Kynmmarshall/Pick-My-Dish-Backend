```markdown
# PickMyDish Backend API

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

A robust REST API backend for the PickMyDish recipe recommendation platform. This server handles user authentication, recipe management, personalized filtering, and file uploads with a focus on performance and security.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Admin/User)
- Input validation and sanitization
- CORS configuration for mobile app access

### 🍳 Recipe Management
- CRUD operations for recipes with image upload
- Multi-filter recipe search (mood, ingredients, time)
- Personalized recipe recommendations
- Favorite recipes system
- Category-based organization

### 📊 Advanced Functionality
- Real-time ingredient database
- Mood-based filtering (7 emotional states)
- Cooking time optimization filters
- User profile management with image upload
- Recipe ownership verification

### 🔧 Technical Features
- Connection pooling for MySQL
- File upload with Multer middleware
- Comprehensive error handling
- Request logging and monitoring
- Automated backup system

## 🏗️ Architecture

```
┌─────────────────┐     HTTPS/REST     ┌─────────────────┐
│  Mobile App     │ ◄────────────────► │   API Server    │
│  (Flutter)      │                    │  (Node.js/Expr.)│
└─────────────────┘                    └─────────────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   MySQL 8.0     │
                                      │   Database      │
                                      └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn** package manager
- **pm2** (for production deployment)

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/Kynmmarshall/pick-my-dish-backend.git
cd pick-my-dish-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=pickmydish
DB_PORT=3306

JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB
```

4. **Set up MySQL database**
```sql
CREATE DATABASE pickmydish;
-- Import database schema from database/schema.sql
```

5. **Run database migrations**
```bash
npm run migrate
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```
Server starts at: `http://localhost:3000`

### Production Mode
```bash
npm start
# Or with PM2
pm2 start server.js --name "pickmydish-api"
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Recipes
- `GET /api/recipes` - Get all recipes (with filters)
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/recipes` - Create new recipe (with image)
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/profile-picture` - Update profile picture
- `GET /api/users/favorites` - Get user's favorite recipes
- `POST /api/users/favorites` - Add recipe to favorites
- `DELETE /api/users/favorites` - Remove recipe from favorites

### Ingredients
- `GET /api/ingredients` - Get all ingredients
- `POST /api/ingredients` - Add new ingredient
- `GET /api/ingredients/search` - Search ingredients

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/auth.test.js
```

## 📊 Database Schema

### Main Tables
- **users** - User accounts and profiles
- **recipes** - Recipe information
- **ingredients** - Available ingredients
- **recipe_ingredients** - Recipe-ingredient relationships
- **favorites** - User favorite recipes
- **categories** - Recipe categories
- **emotions** - Mood/emotional tags

### Relationships
```
users (1) ──── (many) recipes
users (1) ──── (many) favorites
recipes (many) ──── (many) ingredients
recipes (many) ──── (many) emotions
```

## 🛡️ Security Features

1. **Input Validation**: All user inputs validated and sanitized
2. **SQL Injection Prevention**: Parameterized queries
3. **XSS Protection**: Input sanitization and output encoding
4. **Rate Limiting**: Request throttling per endpoint
5. **Helmet.js**: Security headers implementation
6. **CORS**: Configured for specific origins only
7. **File Upload Validation**: Type and size restrictions

## 🚢 Deployment

### Manual Deployment
```bash
# 1. Clone on VPS
git clone https://github.com/Kynmmarshall/pick-my-dish-backend.git

# 2. Install dependencies
npm install --production

# 3. Configure environment
nano .env

# 4. Start with PM2
pm2 start server.js --name pickmydish-api
pm2 save
pm2 startup
```

### Jenkins CI/CD Pipeline
The project includes Jenkins pipeline configuration:
- Automatic build on push to main branch
- Automated testing with coverage reports
- Deployment to production VPS
- Email notifications on success/failure

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── validators/      # Input validation
├── database/
│   ├── migrations/      # Database migration files
│   └── schema.sql       # Database schema
├── uploads/             # Uploaded images
├── tests/               # Test files
├── server.js            # Application entry point
└── package.json         # Dependencies and scripts
```

## 📈 Performance Optimization

- **Connection Pooling**: MySQL connection reuse
- **Query Optimization**: Indexed database tables
- **Caching**: Frequently accessed data caching
- **Compression**: GZIP compression for responses
- **File Compression**: Optimized image uploads

## 🔍 Monitoring & Logging

```bash
# View logs
pm2 logs pickmydish-api

# Monitor resources
pm2 monit

# View application metrics
curl http://localhost:3000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Kamdeu Yamdjeuson Neil Marshall** - Backend & DevOps
- **Tuheu Tchoubi Pempeme Moussa Fahdil** - Frontend & UI/UX

## 🙏 Acknowledgments

- ICT University for academic support
- Node.js and Express.js communities
- MySQL documentation and tutorials
- All contributors and testers

---

**API Documentation**: [Available at /api-docs](http://your-server:3000/api-docs)  
**Support**: Create an issue in the GitHub repository  
**Production URL**: `http://38.242.246.126:3000`
```

This README includes:
1. **Professional badges** for quick recognition
2. **Clear installation instructions**
3. **Complete API documentation**
4. **Architecture diagrams**
5. **Security features** highlighted
6. **Deployment guides**
7. **Project structure** visualization
8. **Contributing guidelines**
9. **Contact and support information**

All in a clean, professional format suitable for GitHub and developer documentation.
