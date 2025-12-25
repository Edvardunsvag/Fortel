import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { syncEmployees } from './routes/sync.js';
import { getEmployees } from './routes/employees.js';
import { initDatabase } from './db/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.post('/api/sync', syncEmployees);
app.get('/api/employees', getEmployees);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

