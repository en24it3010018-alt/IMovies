import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/auth.js';
import moviesRoutes from './server/routes/movies.js';
import theatresRoutes from './server/routes/theatres.js';
import showsRoutes from './server/routes/shows.js';
import bookingsRoutes from './server/routes/bookings.js';
import adminRoutes from './server/routes/admin.js';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', moviesRoutes);
  app.use('/api/theatres', theatresRoutes);
  app.use('/api/shows', showsRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/admin', adminRoutes);

  // Concessions & snacks catalogue
  app.get('/api/snacks', (req, res) => {
    res.json({ success: true, snacks: db.snacks });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'IMovies Cinema Platform API',
      timestamp: new Date().toISOString(),
      moviesCount: db.movies.length,
      showsCount: db.shows.length
    });
  });

  // Vite development middleware or static production serve
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 IMovies Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
