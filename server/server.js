import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { syncEmployees } from './routes/sync.js';
import { getEmployees } from './routes/employees.js';
import { getLeaderboard, submitScore } from './routes/leaderboard.js';
import { initDatabase, pool } from './db/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Track database initialization status
let dbInitialized = false;
let dbInitError = null;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'https://jolly-coast-0123c4103.4.azurestaticapps.net', // Old frontend (if still needed)
  'https://kind-plant-05da66803.6.azurestaticapps.net', // New frontend
  'https://fortedle.hackathon.forteapps.net', // Custom domain
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log rejected origin but don't throw error - let CORS library handle it
      console.warn(`CORS: Rejected origin: ${origin}`);
      callback(null, false); // Return false instead of error
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false, // Let CORS handle preflight
};

// CORS middleware - must be before body parsing
app.use(cors(corsOptions));

// Body parsing - only for non-OPTIONS requests
app.use((req, res, next) => {
  // Skip body parsing for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  express.json()(req, res, next);
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Enhanced health check with database status
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      initialized: dbInitialized,
      connected: false,
    },
  };

  // Check database connection
  if (dbInitialized) {
    try {
      const client = await pool.connect();
      client.release();
      healthStatus.database.connected = true;
    } catch (error) {
      healthStatus.database.connected = false;
      healthStatus.database.error = error.message;
    }
  } else if (dbInitError) {
    healthStatus.database.error = dbInitError.message;
  }

  const statusCode = healthStatus.database.connected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Routes
app.post('/api/sync', syncEmployees);
app.get('/api/employees', getEmployees);
app.get('/api/leaderboard', getLeaderboard);
app.post('/api/leaderboard', submitScore);

// Explicit OPTIONS handler as fallback (shouldn't be needed with CORS middleware, but just in case)
app.options('*', cors(corsOptions));

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  // If it's a CORS error, let CORS middleware handle it
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  console.error('Unhandled error:', err);
  // Don't send error response if headers already sent (CORS might have sent them)
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Declare server variable before handlers
let server;

// Uncaught exception handler - keep process alive but log error
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Keep process alive - don't exit
});

// Unhandled promise rejection handler - keep process alive but log error
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep process alive - don't exit
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  } else {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  }
});

// Start server first, then initialize database in background
try {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    console.log('Initializing database...');
    
    // Initialize database in background (non-blocking)
    initDatabase()
      .then(() => {
        dbInitialized = true;
        dbInitError = null;
        console.log('Database initialized successfully');
      })
      .catch((error) => {
        dbInitError = error;
        console.error('Failed to initialize database:', error);
        console.error('Server will continue running, but database operations may fail');
        // Don't exit - let the server run and retry on next request
      });
  });

  // Handle server listen errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Failed to start server:', error);
    }
    // Don't exit - let the error be logged
  });
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Stack:', error.stack);
  // Exit with error code only if we can't start the server at all
  process.exit(1);
}

