import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/routes.js';
import { syncMySQLDatabase } from './config/mysqlDatabase.js';
import { syncPostgresDatabase } from './config/postgresDatabase.js';
import './models/associations.js';  // Import associations to ensure they're set up

dotenv.config();

const app = express();

// Configure CORS for credentials
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://34.30.86.149',
      'https://frontend-kegiatanmhs-dot-g-09-450802.uc.r.appspot.com',
      // Add your frontend domain if deployed
      /^https?:\/\/.*\.vercel\.app$/, // Vercel deployments
      /^https?:\/\/.*\.netlify\.app$/, // Netlify deployments
      /^https?:\/\/.*\.herokuapp\.com$/, // Heroku deployments
    ];
    
    // Check if origin matches any allowed origin (including regex patterns)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS: Origin ${origin} not allowed`);
      callback(null, true); // Still allow for debugging, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type', 'Cache-Control', 'X-Filename'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle ALL preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`OPTIONS request from origin: ${origin}`);
  
  // Set specific origin instead of wildcard when credentials are involved
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  res.status(200).end();
});

// Global middleware to set CORS headers on ALL responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set specific origin instead of wildcard when credentials are involved
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename');
  
  next();
});

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies with larger limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a simple test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Use routes (this handles all routes including downloads)
app.use(routes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: 'Request entity too large'
    });
  }
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Sync all databases before starting server
const initializeDatabases = async () => {
  try {
    console.log('Initializing databases...');
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('- MySQL DB:', process.env.MYSQL_DB_NAME || 'NOT SET');
    console.log('- PostgreSQL DB:', process.env.POSTGRES_DB_NAME || 'NOT SET');
    console.log('- Google Cloud Storage Project:', process.env.GOOGLE_CLOUD_PROJECT_ID ? 'CONFIGURED' : 'NOT SET');
    console.log('- Google Cloud Storage Bucket:', process.env.GCS_BUCKET_NAME || 'NOT SET');
    
    // Validate Google Cloud Storage configuration
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_PRIVATE_KEY || !process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
      console.warn('⚠️ Google Cloud Storage credentials not fully configured. File upload/download may not work.');
    }
    
    // Sync MySQL database (for users, authentication & student activities)
    await syncMySQLDatabase();
    
    // Sync PostgreSQL database (for student proposals)
    await syncPostgresDatabase();
    
    console.log('All databases initialized successfully!');
    
    // Debug: Check if proposals exist after sync
    try {
      const { default: PostgreSQLService } = await import('./services/PostgreSQLService.js');
      const proposalsCheck = await PostgreSQLService.getAllProposals();
      console.log(`📊 Current proposals in database: ${proposalsCheck.success ? proposalsCheck.data.length : 'Error checking'}`);
    } catch (error) {
      console.log('Could not check proposals count:', error.message);
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.error('Please check your database credentials and ensure the databases are running.');
    process.exit(1);
  }
};

initializeDatabases().then(() => {
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Student Activity Management System running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('- Authentication: /auth/*');
    console.log('- Student Activities (MySQL): /activities');
    console.log('- Student Proposals (PostgreSQL): /proposals');
    console.log('- Admin Panel: /admin/*');
    console.log('- File Storage: Google Cloud Storage');
  });
});
