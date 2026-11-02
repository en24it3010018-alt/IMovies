export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  avatar?: string;
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  language: string;
  durationMinutes: number;
  releaseDate: string;
  rating: string;
  imdbRating: number;
  director: string;
  cast: string[];
  formats: string[];
  status: 'now_showing' | 'coming_soon';
  trailerUrl?: string;
}

export interface Screen {
  id: string;
  name: string;
  format: string;
  rows: string[];
  columns: number;
  totalSeats: number;
}

export interface Theatre {
  id: string;
  name: string;
  city: string;
  address: string;
  totalScreens: number;
  facilities: string[];
  screens: Screen[];
}

export interface Show {
  id: string;
  movieId: string;
  movieTitle: string;
  theatreId: string;
  theatreName: string;
  theatreCity: string;
  screenId: string;
  screenName: string;
  format: string;
  showDate: string;
  startTime: string;
  endTime: string;
  pricing: {
    standard: number;
    premium: number;
    vip: number;
  };
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
}

export interface SeatState {
  seatId: string;
  row: string;
  col: number;
  tier: 'standard' | 'premium' | 'vip' | 'wheelchair';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedBy?: string;
  lockedUntil?: number;
  bookedBy?: string;
}

export interface Snack {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'popcorn' | 'beverage' | 'combo' | 'candy';
  imageUrl: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  userName: string;
  userEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  theatreName: string;
  theatreCity: string;
  screenName: string;
  format: string;
  showDate: string;
  showTime: string;
  seats: string[];
  snacks: { id: string; name: string; quantity: number; price: number }[];
  subtotal: number;
  tax: number;
  bookingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentId: string;
  status: 'confirmed' | 'cancelled';
  qrCodeData: string;
  bookedAt: string;
  cancelledAt?: string;
  refundAmount?: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalTickets: number;
  totalBookings: number;
  confirmedBookingsCount: number;
  cancelledBookingsCount: number;
  totalMovies: number;
  totalTheatres: number;
  totalScheduledShows: number;
  averageOccupancyPercentage: number;
  popularMovies: { title: string; revenue: number; tickets: number }[];
  theatrePerformance: { name: string; revenue: number; bookings: number }[];
}
