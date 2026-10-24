import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scans.js';
import cleanupRoutes from './routes/cleanup.js';
import activityRoutes from './routes/activity.js';
import aiRoutes from './routes/ai.js';
import settingsRoutes from './routes/settings.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/cleanup-plans', cleanupRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);


if (process.env.NODE_ENV !== 'test') {
  // Connect DB
  connectDB();

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Digital Janitor server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   MongoDB: ${process.env.MONGODB_URI}`);
    console.log(`   Ollama: ${process.env.OLLAMA_BASE_URL} (model: ${process.env.OLLAMA_MODEL})`);
  });
}

export default app;
