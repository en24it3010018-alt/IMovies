import { Router, Response } from 'express';
import { db, Booking, Payment, SeatState } from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';
import { notifySeatUpdate } from './shows.js';

const router = Router();

// GET user's bookings
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { status } = req.query;

  let list = db.bookings.filter(b => b.userId === userId);

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(b => b.status === status);
  }

  // Sort by showDate descending
  list.sort((a, b) => `${b.showDate} ${b.showTime}`.localeCompare(`${a.showDate} ${a.showTime}`));

  return res.json({ success: true, count: list.length, bookings: list });
});

// GET single booking by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Allow owner or admin
  if (booking.userId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this booking' });
  }

  return res.json({ success: true, booking });
});

// POST create new booking
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const userEmail = req.user!.email;

    const { showId, seatIds, snacks, paymentMethod, paymentCardDetails } = req.body;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and seat selection are required' });
    }

    const show = db.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    const movie = db.movies.find(m => m.id === show.movieId);
    const seats = db.showSeats.get(showId);
    if (!seats) {
      return res.status(404).json({ success: false, message: 'Seat map not found' });
    }

    // Clean expired locks
    db.cleanExpiredLocks(showId);

    // Validate seat availability
    const selectedSeats: SeatState[] = [];
    for (const seatId of seatIds) {
      const seat = seats.find(s => s.seatId === seatId);
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist` });
      }
      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} has just been booked by another guest` });
      }
      if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy !== userId) {
        return res.status(409).json({ success: false, message: `Seat ${seatId} is currently held by another guest` });
      }
      selectedSeats.push(seat);
    }

    // Calculate totals
    const ticketSubtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);

    let snacksSubtotal = 0;
    const snackItems: { id: string; name: string; quantity: number; price: number }[] = [];
    if (Array.isArray(snacks)) {
      for (const item of snacks) {
        const catalogSnack = db.snacks.find(s => s.id === item.id);
        if (catalogSnack && item.quantity > 0) {
          const itemCost = catalogSnack.price * item.quantity;
          snacksSubtotal += itemCost;
          snackItems.push({
            id: catalogSnack.id,
            name: catalogSnack.name,
            quantity: item.quantity,
            price: catalogSnack.price
          });
        }
      }
    }

    const subtotal = ticketSubtotal + snacksSubtotal;
    const tax = Math.round(subtotal * 0.08875 * 100) / 100;
    const bookingFee = Math.round(seatIds.length * 1.50 * 100) / 100;
    const totalAmount = Math.round((subtotal + tax + bookingFee) * 100) / 100;

    const bookingId = `bk-${Date.now()}`;
    const cityCode = show.theatreCity.substring(0, 2).toUpperCase() || 'IM';
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `IMV-${randomHex}-${cityCode}`;

    // Mark seats as booked
    seats.forEach(s => {
      if (seatIds.includes(s.seatId)) {
        s.status = 'booked';
        s.bookedBy = userId;
        s.bookingId = bookingId;
        s.lockedBy = undefined;
        s.lockedUntil = undefined;
      }
    });
    db.showSeats.set(showId, seats);

    // Create Payment record
    const paymentId = `pay-${Date.now()}`;
    const paymentRecord: Payment = {
      id: paymentId,
      bookingId,
      userId,
      amount: totalAmount,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: paymentCardDetails ? `Card ···· ${paymentCardDetails.slice(-4) || '8842'}` : (paymentMethod || 'Cinema Pay'),
      transactionId: `tx_imv_${Date.now()}_${randomHex}`,
      createdAt: new Date().toISOString()
    };
    db.payments.push(paymentRecord);

    // Create Booking
    const newBooking: Booking = {
      id: bookingId,
      bookingReference,
      userId,
      userName,
      userEmail,
      showId,
      movieId: show.movieId,
      movieTitle: show.movieTitle,
      moviePoster: movie?.posterUrl || '/src/assets/images/movie_poster_void_1793640130552.jpg',
      theatreName: show.theatreName,
      theatreCity: show.theatreCity,
      screenName: show.screenName,
      format: show.format,
      showDate: show.showDate,
      showTime: show.startTime,
      seats: seatIds,
      snacks: snackItems,
      subtotal,
      tax,
      bookingFee,
      totalAmount,
      paymentMethod: paymentMethod || 'card',
      paymentId,
      status: 'confirmed',
      qrCodeData: `IMOVIES|${bookingId}|${bookingReference}|${show.movieTitle}|${seatIds.join(',')}`,
      bookedAt: new Date().toISOString()
    };

    db.bookings.unshift(newBooking);

    // Broadcast seat change to any connected clients
    notifySeatUpdate(showId);

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: newBooking
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error processing reservation' });
  }
});

// POST cancel booking and issue refund
router.post('/:id/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.userId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }

  // Release seats back to available
  const seats = db.showSeats.get(booking.showId);
  if (seats) {
    seats.forEach(s => {
      if (booking.seats.includes(s.seatId) && s.bookingId === booking.id) {
        s.status = 'available';
        s.bookedBy = undefined;
        s.bookingId = undefined;
      }
    });
    db.showSeats.set(booking.showId, seats);
  }

  // Calculate refund (full refund minus standard nominal $2 processing)
  const refundAmount = Math.max(0, Math.round((booking.totalAmount - 2.00) * 100) / 100);

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  booking.refundAmount = refundAmount;

  // Add refund record
  db.payments.push({
    id: `ref-${Date.now()}`,
    bookingId: booking.id,
    userId: booking.userId,
    amount: refundAmount,
    currency: 'USD',
    status: 'refunded',
    paymentMethod: 'Original Payment Method',
    transactionId: `ref_imv_${Date.now()}`,
    createdAt: new Date().toISOString()
  });

  // Notify clients
  notifySeatUpdate(booking.showId);

  return res.json({
    success: true,
    message: `Booking cancelled successfully. $${refundAmount.toFixed(2)} refunded to your original payment method.`,
    booking
  });
});

export default router;
