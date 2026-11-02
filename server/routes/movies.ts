import { Router } from 'express';
import { db, Movie } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = Router();

// GET all movies with search & filtering
router.get('/', (req, res) => {
  let list = [...db.movies];
  const { genre, language, search, status, format } = req.query;

  if (status && typeof status === 'string') {
    list = list.filter(m => m.status === status);
  }

  if (genre && typeof genre === 'string' && genre !== 'All') {
    list = list.filter(m => m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
  }

  if (language && typeof language === 'string' && language !== 'All') {
    list = list.filter(m => m.language.toLowerCase() === language.toLowerCase());
  }

  if (format && typeof format === 'string' && format !== 'All') {
    list = list.filter(m => m.formats.includes(format));
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.cast.some(c => c.toLowerCase().includes(q)) ||
      m.synopsis.toLowerCase().includes(q)
    );
  }

  return res.json({ success: true, count: list.length, movies: list });
});

// GET single movie details by ID with upcoming shows
router.get('/:id', (req, res) => {
  const movie = db.movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const upcomingShows = db.shows.filter(s => s.movieId === movie.id && s.status === 'scheduled');
  return res.json({ success: true, movie, upcomingShows });
});

// ADMIN: Create new movie
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      title,
      synopsis,
      posterUrl,
      backdropUrl,
      genres,
      language,
      durationMinutes,
      releaseDate,
      rating,
      imdbRating,
      director,
      cast,
      formats,
      status,
      trailerUrl
    } = req.body;

    if (!title || !synopsis) {
      return res.status(400).json({ success: false, message: 'Title and synopsis are required' });
    }

    const newMovie: Movie = {
      id: `mov-${Date.now()}`,
      title,
      synopsis,
      posterUrl: posterUrl || '/src/assets/images/movie_poster_void_1793640130552.jpg',
      backdropUrl: backdropUrl || '/src/assets/images/hero_cinema_imax_1793640129618.jpg',
      genres: Array.isArray(genres) ? genres : [genres || 'Sci-Fi'],
      language: language || 'English',
      durationMinutes: Number(durationMinutes) || 120,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      rating: rating || 'PG-13',
      imdbRating: Number(imdbRating) || 8.0,
      director: director || 'Visionary Director',
      cast: Array.isArray(cast) ? cast : (cast ? cast.split(',').map((c: string) => c.trim()) : ['Lead Star']),
      formats: Array.isArray(formats) ? formats : ['Standard', 'Dolby Atmos'],
      status: status === 'coming_soon' ? 'coming_soon' : 'now_showing',
      trailerUrl: trailerUrl || ''
    };

    db.movies.unshift(newMovie);
    return res.status(201).json({ success: true, message: 'Movie created successfully', movie: newMovie });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN: Update existing movie
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = db.movies.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const current = db.movies[index];
  const updated: Movie = {
    ...current,
    ...req.body,
    id: current.id // preserve id
  };

  db.movies[index] = updated;
  return res.json({ success: true, message: 'Movie updated successfully', movie: updated });
});

// ADMIN: Delete movie
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = db.movies.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const deleted = db.movies.splice(index, 1)[0];
  // also mark associated shows
  db.shows = db.shows.filter(s => s.movieId !== deleted.id);
  return res.json({ success: true, message: 'Movie and associated shows deleted', movie: deleted });
});

export default router;
