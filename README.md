# VibeCircles Backend API

A modern Node.js/Express backend for the VibeCircles social media platform.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access control
- 👥 **User Management** - User registration, profiles, following/followers
- 📝 **Posts & Comments** - Create, read, update, delete posts and comments
- ❤️ **Likes & Interactions** - Like/unlike posts and track interactions
- 👥 **Groups** - Create and manage groups with member roles
- 🔔 **Notifications** - Real-time notifications for user activities
- 📤 **File Uploads** - Image upload with automatic optimization and thumbnails
- 🛡️ **Security** - Rate limiting, input validation, CORS, helmet security
- 📊 **Database** - MySQL with connection pooling and transactions
- 🚀 **Performance** - Compression, caching, optimized queries

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Sharp for image processing
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Sessions**: Express-session with MySQL store

## Prerequisites

- Node.js 18.0.0 or higher
- MySQL 8.0 or higher
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibecircles/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=vibecircles
   DB_USER=root
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Other settings...
   ```

4. **Database Setup**
   - Create a MySQL database named `vibecircles`
   - Import the schema from `../vibecircles_schema.sql`

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get user following

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create group
- `POST /api/groups/:id/join` - Join group
- `DELETE /api/groups/:id/join` - Leave group
- `GET /api/groups/:id/members` - Get group members

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Uploads
- `POST /api/upload/image` - Upload image
- `POST /api/upload/avatar` - Upload avatar
- `DELETE /api/upload/:filename` - Delete uploaded file

## Database Schema

The backend uses the existing MySQL schema from `vibecircles_schema.sql`. Key tables include:

- `users` - User accounts and profiles
- `posts` - User posts and content
- `comments` - Post comments
- `likes` - Post likes
- `followers` - User following relationships
- `groups` - User groups
- `group_members` - Group membership
- `notifications` - User notifications

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Input Validation** - Express-validator for request validation
- **Rate Limiting** - Prevent abuse with request rate limiting
- **CORS Protection** - Configured CORS for cross-origin requests
- **Helmet Security** - Security headers and protection
- **SQL Injection Prevention** - Parameterized queries
- **File Upload Security** - File type and size validation

## Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run migrate     # Run database migrations
npm run seed        # Seed database with sample data
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `vibecircles` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `MAX_FILE_SIZE` | Max file upload size | `10485760` (10MB) |

## Deployment

### Render Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Render

2. **Create Web Service**
   - Service Type: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**
   - Add all required environment variables in Render dashboard
   - Set `NODE_ENV=production`

4. **Database**
   - Use Render's MySQL add-on or external MySQL service
   - Update database connection variables

### Environment Variables for Production

```env
NODE_ENV=production
PORT=10000
DB_HOST=your-production-db-host
DB_NAME=vibecircles
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## API Documentation

### Request Format
All API requests should include:
- `Content-Type: application/json` header
- For authenticated routes: `Authorization: Bearer <token>` header

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
