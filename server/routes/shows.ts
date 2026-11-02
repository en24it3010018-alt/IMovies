import { Router, Response } from 'express';
import { db, Show, SeatState } from '../db.js';
import { authenticateToken, requireAdmin, optionalAuthenticateToken, AuthRequest } from '../auth.js';

const router = Router();

// Store active SSE connections per show: Map<showId, Set<Response>>
const sseClients: Map<string, Set<Response>> = new Map();

export function notifySeatUpdate(showId: string) {
  const clients = sseClients.get(showId);
  if (!clients || clients.size === 0) return;

  db.cleanExpiredLocks(showId);
  const seats = db.showSeats.get(showId) || [];
  const payload = JSON.stringify({
    showId,
    timestamp: Date.now(),
    seats: seats.map(s => ({
      seatId: s.seatId,
      status: s.status,
      lockedBy: s.lockedBy,
      lockedUntil: s.lockedUntil
    }))
  });

  clients.forEach(client => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      clients.delete(client);
    }
  });
}

// GET all shows with filters
router.get('/', (req, res) => {
  const { movieId, theatreId, date, city } = req.query;
  let list = db.shows.filter(s => s.status !== 'cancelled');

  if (movieId && typeof movieId === 'string') {
    list = list.filter(s => s.movieId === movieId);
  }
  if (theatreId && typeof theatreId === 'string') {
    list = list.filter(s => s.theatreId === theatreId);
  }
  if (date && typeof date === 'string') {
    list = list.filter(s => s.showDate === date);
  }
  if (city && typeof city === 'string' && city !== 'All') {
    list = list.filter(s => s.theatreCity.toLowerCase() === city.toLowerCase());
  }

  // Sort by date and startTime
  list.sort((a, b) => `${a.showDate} ${a.startTime}`.localeCompare(`${b.showDate} ${b.startTime}`));

  return res.json({ success: true, count: list.length, shows: list });
});

// GET single show details
router.get('/:id', (req, res) => {
  const show = db.shows.find(s => s.id === req.params.id);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found' });
  }
  const movie = db.movies.find(m => m.id === show.movieId);
  const theatre = db.theatres.find(t => t.id === show.theatreId);
  return res.json({ success: true, show, movie, theatre });
});

// GET seat map for a show with real-time status
router.get('/:id/seats', (req, res) => {
  const showId = req.params.id;
  const show = db.shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found' });
  }

  // Clean expired locks
  db.cleanExpiredLocks(showId);

  const seats = db.showSeats.get(showId) || [];
  const bookedCount = seats.filter(s => s.status === 'booked').length;
  const lockedCount = seats.filter(s => s.status === 'locked').length;
  const availableCount = seats.length - bookedCount - lockedCount;

  return res.json({
    success: true,
    showId,
    stats: {
      total: seats.length,
      available: availableCount,
      booked: bookedCount,
      locked: lockedCount,
      occupancyPercentage: Math.round(((bookedCount + lockedCount) / (seats.length || 1)) * 100)
    },
    seats
  });
});

// SSE endpoint for live seat map updates
router.get('/:id/seat-stream', (req, res) => {
  const showId = req.params.id;
  const show = db.shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(showId)) {
    sseClients.set(showId, new Set());
  }
  const clients = sseClients.get(showId)!;
  clients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', showId })}\n\n`);

  req.on('close', () => {
    clients.delete(res);
    if (clients.size === 0) {
      sseClients.delete(showId);
    }
  });
});

// Lock seats (e.g. for 10 minutes while customer completes ticket purchase)
router.post('/:id/lock-seats', optionalAuthenticateToken, (req: AuthRequest, res: Response) => {
  const showId = req.params.id;
  const { seatIds, lockHolderId } = req.body;

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of seat IDs is required' });
  }

  const holderId = req.user?.id || lockHolderId;
  if (!holderId) {
    return res.status(400).json({ success: false, message: 'lockHolderId or authorization token is required' });
  }

  db.cleanExpiredLocks(showId);
  const seats = db.showSeats.get(showId);
  if (!seats) {
    return res.status(404).json({ success: false, message: 'Seats not found for show' });
  }

  // Check if any seat is already booked or locked by someone else
  const conflicts: string[] = [];
  const now = Date.now();
  const lockDurationMs = 10 * 60 * 1000; // 10 minutes
  const lockedUntil = now + lockDurationMs;

  for (const sId of seatIds) {
    const seat = seats.find(s => s.seatId === sId);
    if (!seat) {
      conflicts.push(`${sId} (does not exist)`);
      continue;
    }
    if (seat.status === 'booked') {
      conflicts.push(`${sId} is already booked`);
    } else if (seat.status === 'locked' && seat.lockedBy !== holderId) {
      conflicts.push(`${sId} is currently reserved by another guest`);
    }
  }

  if (conflicts.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Some requested seats are unavailable',
      conflicts
    });
  }

  // Apply locks
  seats.forEach(seat => {
    if (seatIds.includes(seat.seatId)) {
      seat.status = 'locked';
      seat.lockedBy = holderId;
      seat.lockedUntil = lockedUntil;
    }
  });

  db.showSeats.set(showId, seats);
  notifySeatUpdate(showId);

  return res.json({
    success: true,
    message: 'Seats locked for checkout',
    lockedSeats: seatIds,
    lockedUntil
  });
});

// Unlock seats (if user navigates away or clears selection)
router.post('/:id/unlock-seats', optionalAuthenticateToken, (req: AuthRequest, res: Response) => {
  const showId = req.params.id;
  const { seatIds, lockHolderId } = req.body;

  const holderId = req.user?.id || lockHolderId;
  const seats = db.showSeats.get(showId);
  if (!seats) {
    return res.status(404).json({ success: false, message: 'Seats not found for show' });
  }

  seats.forEach(seat => {
    if (Array.isArray(seatIds) ? seatIds.includes(seat.seatId) : true) {
      if (seat.status === 'locked' && (!holderId || seat.lockedBy === holderId)) {
        seat.status = 'available';
        seat.lockedBy = undefined;
        seat.lockedUntil = undefined;
      }
    }
  });

  db.showSeats.set(showId, seats);
  notifySeatUpdate(showId);

  return res.json({ success: true, message: 'Seats unlocked' });
});

// ADMIN: Schedule new show
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { movieId, theatreId, screenId, showDate, startTime, pricing, format } = req.body;

  const movie = db.movies.find(m => m.id === movieId);
  const theatre = db.theatres.find(t => t.id === theatreId);
  if (!movie || !theatre) {
    return res.status(400).json({ success: false, message: 'Valid movie and theatre are required' });
  }

  const screen = theatre.screens.find(s => s.id === screenId) || theatre.screens[0];
  const newShow: Show = {
    id: `show-${Date.now()}`,
    movieId: movie.id,
    movieTitle: movie.title,
    theatreId: theatre.id,
    theatreName: theatre.name,
    theatreCity: theatre.city,
    screenId: screen.id,
    screenName: screen.name,
    format: format || screen.format,
    showDate,
    startTime,
    endTime: `${parseInt(startTime.split(':')[0]) + 2}:${startTime.split(':')[1]}`,
    pricing: pricing || { standard: 18.00, premium: 23.00, vip: 30.00 },
    status: 'scheduled'
  };

  db.shows.push(newShow);

  // Initialize fresh seat map
  const seats: SeatState[] = [];
  const rows = screen.rows || ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = screen.columns || 12;

  rows.forEach((r, idx) => {
    let tier: 'standard' | 'premium' | 'vip' | 'wheelchair' = 'standard';
    let p = newShow.pricing.standard;
    if (idx >= rows.length - 2) {
      tier = 'vip';
      p = newShow.pricing.vip;
    } else if (idx >= 2) {
      tier = 'premium';
      p = newShow.pricing.premium;
    }

    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatId: `${r}${c}`,
        row: r,
        col: c,
        tier: (r === 'A' && (c === 1 || c === cols)) ? 'wheelchair' : tier,
        price: p,
        status: 'available'
      });
    }
  });

  db.showSeats.set(newShow.id, seats);

  return res.status(201).json({ success: true, show: newShow });
});

// ADMIN: Delete or cancel show
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = db.shows.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Show not found' });
  }

  const removed = db.shows.splice(index, 1)[0];
  db.showSeats.delete(removed.id);
  return res.json({ success: true, message: 'Show cancelled and deleted', show: removed });
});

export default router;
