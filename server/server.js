// server.js — Chef's Diary Express Backend
// Entry point for the Node.js API server

import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import 'dotenv/config'; // Loads .env into process.env automatically
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import recipeRoutes from './routes/recipe.routes.js';
import aiRoutes from './routes/ai.routes.js';
import followRoutes from './routes/follow.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/user.routes.js';
import networkRoutes from './routes/network.routes.js';
import searchRoutes from './routes/search.js';
import collectionRoutes from './routes/collection.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';


const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────
// CORS CONFIGURATION
//
// CORS (Cross-Origin Resource Sharing) is a browser security rule.
// When your React app on vercel.app talks to your API on render.com,
// the browser asks the server: "is this frontend allowed to talk to you?"
// We must explicitly whitelist the allowed origins.
//
// WHY an array and not a string?
// We need to allow TWO different origins:
//   1. http://localhost:5173  — your Vite dev server (local development)
//   2. Your Vercel URL        — the production frontend
//
// The .filter(Boolean) removes any undefined entries in case
// process.env.CLIENT_URL hasn't been set yet during early development.
// ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',   // Vite's default development port
  'http://localhost:4173',   // Vite's preview mode port (npm run preview)
  process.env.CLIENT_URL,    // Your Vercel production URL (set in Render dashboard)
].filter(Boolean);           // Remove undefined/null entries safely

const corsOptions = {
  origin: (incomingOrigin, callback) => {
    // Allow requests with NO origin header (e.g. Postman, curl, mobile apps)
    if (!incomingOrigin) return callback(null, true);

    if (allowedOrigins.includes(incomingOrigin)) {
      // Origin is on the whitelist — allow the request
      return callback(null, true);
    }

    // Origin is NOT on the whitelist — block with a clear error
    return callback(
      new Error(`CORS Policy: Request from origin "${incomingOrigin}" is not allowed.`)
    );
  },
  credentials: true, // Allow cookies and Authorization headers to be sent cross-origin
};

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE STACK
// Order matters here — CORS and Helmet must come before your routes.
// ─────────────────────────────────────────────────────────────────

// 1. Helmet sets secure HTTP headers (prevents common attacks)
app.use(helmet());

// 2. CORS — must be before all route definitions
app.use(cors(corsOptions));

// 3. Morgan logs every incoming request to the console (dev-friendly)
//    Example output: GET /api/health 200 3.456 ms - 89
app.use(morgan('dev'));

// 4. Parse incoming JSON request bodies (e.g. POST/PUT payloads)
app.use(express.json({ limit: '10mb' }));

// 5. Parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

// Health Check Endpoint
// This is our deployment verification endpoint.
// The React frontend will call this to prove the connection works.
// Later: Render and monitoring tools also use this to confirm the service is alive.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     "Chef's Diary API is live and healthy!",
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    version:     '1.0.0',
    uptime:      `${Math.floor(process.uptime())} seconds`,
  });
});

// Root route — helpful redirect for anyone visiting the API URL directly in a browser
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Chef's Diary API. Visit /api/health to check status.",
  });
});

// ── Mount Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/recipes',  recipeRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/follow',   followRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/network',  networkRoutes);
app.use('/api/search',   searchRoutes);
app.use('/api/recommendations', recommendationRoutes);


// ─────────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// These MUST be defined AFTER all routes.
// Express identifies error handlers by their 4-argument signature: (err, req, res, next)
// ─────────────────────────────────────────────────────────────────

// 404 Handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler — catches errors thrown anywhere in the app
// (including our CORS error above)
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─────────────────────────────────────────────────────────────────
// START SERVER
// process.env.PORT is automatically provided by Render in production.
// We fall back to 5000 for local development.
// ─────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log(`  🍳  Chef's Diary API`);
    console.log(`  ➜   Local:   http://localhost:${PORT}`);
    console.log(`  ➜   Env:     ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
});

export default app;