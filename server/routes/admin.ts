import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = Router();

// GET Admin Dashboard Analytics
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const confirmedBookings = db.bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalTickets = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);

  // Calculate seat occupancy rate across all active shows
  let totalAuditoriumSeats = 0;
  let totalOccupiedSeats = 0;

  db.showSeats.forEach(seats => {
    totalAuditoriumSeats += seats.length;
    totalOccupiedSeats += seats.filter(s => s.status === 'booked' || s.status === 'locked').length;
  });

  const averageOccupancy = totalAuditoriumSeats > 0
    ? Math.round((totalOccupiedSeats / totalAuditoriumSeats) * 100)
    : 0;

  // Movie performance
  const movieRevenueMap: { [movieId: string]: { title: string; revenue: number; tickets: number } } = {};
  confirmedBookings.forEach(b => {
    if (!movieRevenueMap[b.movieId]) {
      movieRevenueMap[b.movieId] = { title: b.movieTitle, revenue: 0, tickets: 0 };
    }
    movieRevenueMap[b.movieId].revenue += b.totalAmount;
    movieRevenueMap[b.movieId].tickets += b.seats.length;
  });

  const popularMovies = Object.values(movieRevenueMap).sort((a, b) => b.revenue - a.revenue);

  // Theatre breakdown
  const theatreStatsMap: { [theatreName: string]: { name: string; revenue: number; bookings: number } } = {};
  confirmedBookings.forEach(b => {
    if (!theatreStatsMap[b.theatreName]) {
      theatreStatsMap[b.theatreName] = { name: b.theatreName, revenue: 0, bookings: 0 };
    }
    theatreStatsMap[b.theatreName].revenue += b.totalAmount;
    theatreStatsMap[b.theatreName].bookings += 1;
  });

  return res.json({
    success: true,
    stats: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTickets,
      totalBookings: db.bookings.length,
      confirmedBookingsCount: confirmedBookings.length,
      cancelledBookingsCount: db.bookings.filter(b => b.status === 'cancelled').length,
      totalMovies: db.movies.length,
      totalTheatres: db.theatres.length,
      totalScheduledShows: db.shows.filter(s => s.status === 'scheduled').length,
      averageOccupancyPercentage: averageOccupancy,
      popularMovies,
      theatrePerformance: Object.values(theatreStatsMap)
    }
  });
});

// GET All Bookings for Admin Ledger
router.get('/bookings', authenticateToken, requireAdmin, (req, res) => {
  const { status, showId, movieId } = req.query;
  let list = [...db.bookings];

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(b => b.status === status);
  }
  if (showId && typeof showId === 'string') {
    list = list.filter(b => b.showId === showId);
  }
  if (movieId && typeof movieId === 'string') {
    list = list.filter(b => b.movieId === movieId);
  }

  return res.json({ success: true, count: list.length, bookings: list });
});

export default router;
