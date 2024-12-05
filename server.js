const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration with specific origin
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Cookie parser for CSRF and refresh tokens
app.use(cookieParser());

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per hour
  message: 'Too many login attempts, please try again later.'
});

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Middleware
app.use(express.json());
app.use(auth);

//log requests to the console
app.use((req, res, next) => {
  //get time of request
  const date = new Date();
  //log the request method and path
  console.log(`\n${date.toLocaleString()} - ${req.method} ${req.path}`);
  //response output
  res.on("finish", () => {
    //get time of response
    const date = new Date();
    //log the response status code and message
    console.log(`${date.toLocaleString()} - ${res.statusCode} ${res.statusMessage}`);
  });
  
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// GraphQL endpoint with CSRF protection
app.use('/graphql', 
  csrfProtection,
  graphqlHTTP((req) => ({
    schema: schema,
    rootValue: resolvers,
    graphiql: process.env.NODE_ENV !== 'production',
    context: {
      isAuth: req.isAuth,
      userId: req.userId
    }
  }))
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Auth endpoints with rate limiting and CSRF protection
app.post('/api/auth/login', authLimiter, csrfProtection, require('./routes/auth').login);
app.post('/api/auth/register', authLimiter, csrfProtection, require('./routes/auth').register);

// Refresh token endpoint
app.post('/api/auth/refresh-token', csrfProtection, require('./routes/auth').refreshToken);

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token'
    });
  }
  next(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});