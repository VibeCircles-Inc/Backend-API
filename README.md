# VibeCircles Backend API

A Node.js/Express backend API for the VibeCircles social media platform, built with Supabase as the database.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: User registration, profiles, and friend system
- 📝 **Posts & Comments**: Create, read, update, delete posts with comments and likes
- 🔍 **Search & Pagination**: Advanced search and pagination for all resources
- 🛡️ **Security**: Rate limiting, input validation, CORS, and security headers
- 📊 **Real-time Ready**: Prepared for real-time features with Socket.IO
- 🗄️ **Database**: PostgreSQL with Supabase for scalability and reliability

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer (ready for implementation)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vibecircles/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
   ```

4. **Set up Supabase Database**
   - Follow the Supabase setup guide in `../database/deployment/supabase-setup.md`
   - Run the SQL schema to create tables
   - Configure Row Level Security (RLS) policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/logout` | Logout user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (with search) |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id/profile` | Update user profile |
| GET | `/api/users/:id/posts` | Get user's posts |
| GET | `/api/users/:id/friends` | Get user's friends |
| POST | `/api/users/:id/friend-request` | Send friend request |
| PUT | `/api/users/:id/friend-request` | Accept/reject friend request |
| DELETE | `/api/users/:id/friend` | Remove friend |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all posts (with filters) |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/unlike post |
| POST | `/api/posts/:id/comments` | Add comment to post |
| GET | `/api/posts/:id/comments` | Get post comments |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Request/Response Format

### Success Response
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
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message",
      "value": "invalid_value"
    }
  ]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |

## Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
```

### Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── posts.js             # Posts routes
│   └── users.js             # Users routes
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
└── README.md                # This file
```

## Deployment

### Prerequisites for Deployment

1. **Supabase Setup**
   - Create a Supabase project
   - Run the database schema
   - Configure RLS policies
   - Get API keys

2. **Environment Variables**
   - Set all required environment variables
   - Use strong JWT secrets
   - Configure CORS for your domain

### Deployment Options

#### Render (Recommended)

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Render

2. **Create Web Service**
   - Service Type: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Set Environment Variables**
   - Add all required environment variables in Render dashboard

4. **Deploy**
   - Render will automatically deploy on every push to main branch

#### Other Platforms

The application can be deployed to any Node.js hosting platform:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js provides security headers
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **SQL Injection Protection**: Parameterized queries via Supabase

## Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Handling**: Global error handler with proper responses
- **Health Check**: `/health` endpoint for monitoring

## Future Enhancements

- [ ] File upload functionality
- [ ] Real-time messaging with Socket.IO
- [ ] Email notifications
- [ ] Push notifications
- [ ] Advanced search with full-text search
- [ ] Image optimization and CDN
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] Docker containerization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the Supabase documentation
- Review the API documentation above
