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

console.log("Setting up connection")
const { MONGO_USER, MONGO_PASSWORD } = process.env;

const mongoURI = `mongodb://${MONGO_USER}:${encodeURIComponent(MONGO_PASSWORD)}@mongo:27017`;
const app = express();

// Middleware order is important!
app.use(express.json());
app.use(cookieParser());

// Security Headers
app.use(helmet());

// CORS configuration with specific origin
app.use(cors({
  origin: [
      'https://local.arshadshah.com:5173',
      'https://expense.arshadshah.com',
    ],
  credentials: true
}));

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
  windowMs: 60 * 5000, // 5 minutes
  max: 100000000000, // limit each IP to 5 login attempts per 5 minutes
  message: 'Too many login attempts, please try again later.'
});

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: '.arshadshah.com'
  }
});

// Auth middleware
app.use(auth);

// Enhanced request logging
app.use((req, res, next) => {
  const date = new Date();
  console.log('\n=== Request Details ===');
  console.log(`Timestamp: ${date.toLocaleString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log('\nHeaders:');
  console.log(JSON.stringify(req.headers, null, 2));
  console.log('\nCookies:');
  console.log(JSON.stringify(req.cookies, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('\nBody:');
    // Mask sensitive data in password fields
    const sanitizedBody = JSON.parse(JSON.stringify(req.body));
    if (sanitizedBody.password) sanitizedBody.password = '[MASKED]';
    console.log(JSON.stringify(sanitizedBody, null, 2));
  }

  // Log response
  res.on("finish", () => {
    console.log('\n=== Response Details ===');
    console.log(`Timestamp: ${date.toLocaleString()}`);
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`Headers:`, JSON.stringify(res.getHeaders(), null, 2));
    console.log('==================\n');
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authLimiter, csrfProtection, authRouter);

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

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token'
    });
  }
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!'
  });
});
try {
  mongoose.connect(mongoURI).then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
} catch (err) {
  console.error('Error parsing MongoDB URI:', err);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});