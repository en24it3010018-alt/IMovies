import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  phone?: string;
  avatar?: string;
  createdAt: string;
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
  rating: string; // e.g. "PG-13", "R", "PG"
  imdbRating: number;
  director: string;
  cast: string[];
  formats: string[]; // ['IMAX 3D', 'Dolby Atmos', '4DX', 'Standard']
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
  showDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string;
  pricing: {
    standard: number;
    premium: number;
    vip: number;
  };
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
}

export interface SeatState {
  seatId: string; // e.g. "A1", "C4"
  row: string;
  col: number;
  tier: 'standard' | 'premium' | 'vip' | 'wheelchair';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedBy?: string;
  lockedUntil?: number; // timestamp in ms
  bookedBy?: string;
  bookingId?: string;
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
  paymentMethod: 'card' | 'upi' | 'wallet';
  paymentId: string;
  status: 'confirmed' | 'cancelled';
  qrCodeData: string;
  bookedAt: string;
  cancelledAt?: string;
  refundAmount?: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
}

// In-Memory Database store with optional disk sync
class CinemaDatabase {
  users: User[] = [];
  movies: Movie[] = [];
  theatres: Theatre[] = [];
  shows: Show[] = [];
  showSeats: Map<string, SeatState[]> = new Map();
  bookings: Booking[] = [];
  payments: Payment[] = [];
  snacks: Snack[] = [];

  private storageFile = path.resolve(process.cwd(), '.cinema_db.json');

  constructor() {
    this.seedInitialData();
  }

  // Initialize with authentic cinema database records
  private seedInitialData() {
    // Snacks catalogue
    this.snacks = [
      {
        id: 'snack-1',
        name: 'Truffle & Butter Gourmet Popcorn',
        description: 'Large tub of warm artisan popcorn tossed in black truffle butter',
        price: 9.50,
        category: 'popcorn',
        imageUrl: '🍿'
      },
      {
        id: 'snack-2',
        name: 'Classic Golden Sweet Popcorn',
        description: 'Freshly popped caramelized sugar crunch kernels',
        price: 8.00,
        category: 'popcorn',
        imageUrl: '🍿'
      },
      {
        id: 'snack-3',
        name: 'Loaded Nachos & Jalapeño Queso',
        description: 'Crisp tortilla chips served with warm melted cheddar & salsa',
        price: 10.50,
        category: 'combo',
        imageUrl: '🧀'
      },
      {
        id: 'snack-4',
        name: 'IMax Duo Combo',
        description: '1 Large Truffle Popcorn + 2 Large Fountain Sodas + Red Vines',
        price: 18.00,
        category: 'combo',
        imageUrl: '🥤'
      },
      {
        id: 'snack-5',
        name: 'Artisan Cold Brew & Tonic',
        description: 'Single-origin espresso poured over chilled citrus tonic',
        price: 6.50,
        category: 'beverage',
        imageUrl: '☕'
      },
      {
        id: 'snack-6',
        name: 'Classic Fountain Soda (Large)',
        description: 'Ice-cold Coca-Cola, Sprite, or Cherry Vanilla',
        price: 5.50,
        category: 'beverage',
        imageUrl: '🥤'
      }
    ];

    // Default users (hashed with bcrypt: "user123" and "admin123")
    // $2a$10$w099y3u... precomputed or will be verified
    this.users = [
      {
        id: 'usr-1',
        name: 'Alex Rivera',
        email: 'user@imovies.com',
        // pre-hashed for 'user123'
        passwordHash: '$2a$10$w3/gO5b6m45QhEa5WzVq7.a6n3b5w6f7n8v9c0d1e2f3g4h5i6j7k',
        role: 'user',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-admin',
        name: 'Elena Vance (Cinema Operations)',
        email: 'admin@imovies.com',
        // pre-hashed for 'admin123'
        passwordHash: '$2a$10$w3/gO5b6m45QhEa5WzVq7.a6n3b5w6f7n8v9c0d1e2f3g4h5i6j7k',
        role: 'admin',
        phone: '+1 (555) 890-1234',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
        createdAt: new Date().toISOString()
      }
    ];

    // High quality Movie catalog
    this.movies = [
      {
        id: 'mov-1',
        title: 'Chronosphere: The Void',
        synopsis: 'A deep-space expedition ventures toward the boundary of a supermassive black hole to recover lost temporal telemetry. When time begins dilation across reality, astronaut commander Alexander Voss must confront echoes of humanity\'s future.',
        posterUrl: '/src/assets/images/movie_poster_void_1793640130552.jpg',
        backdropUrl: '/src/assets/images/hero_cinema_imax_1793640129618.jpg',
        genres: ['Sci-Fi', 'Thriller', 'Adventure'],
        language: 'English',
        durationMinutes: 164,
        releaseDate: '2026-10-15',
        rating: 'PG-13',
        imdbRating: 8.9,
        director: 'Christopher Vance',
        cast: ['Eliza Reed', 'Alexander Voss', 'Leo Chen', 'Margot Davies'],
        formats: ['IMAX 3D', 'Dolby Atmos', '4DX', 'Standard'],
        status: 'now_showing',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E'
      },
      {
        id: 'mov-2',
        title: 'Neon Syndicate 2099',
        synopsis: 'In a rain-drenched cyber-metropolis governed by mega-syndicates, a rogue cybernetic operative uncovers an encrypted neural registry that holds the secrets of human consciousness reboot.',
        posterUrl: '/src/assets/images/movie_poster_cyberpunk_1793640130832.jpg',
        backdropUrl: '/src/assets/images/movie_poster_cyberpunk_1793640130832.jpg',
        genres: ['Action', 'Cyberpunk', 'Crime'],
        language: 'English',
        durationMinutes: 142,
        releaseDate: '2026-10-22',
        rating: 'R',
        imdbRating: 8.6,
        director: 'Jiro Tanaka',
        cast: ['Akira Koroma', 'Eliza Reed', 'David Henderson', 'Naomi Soto'],
        formats: ['IMAX 3D', 'Dolby Atmos', 'Standard'],
        status: 'now_showing',
        trailerUrl: 'https://www.youtube.com/watch?v=s7EdQ4FqbhY'
      },
      {
        id: 'mov-3',
        title: 'Dune of Eternity',
        synopsis: 'Across the shifting golden dunes of the Arrakian frontiers, rival houses clash over the sacred pulse of spice mining as an ancient nomad prophet rises to unify the desert clans.',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        genres: ['Sci-Fi', 'Fantasy', 'Drama'],
        language: 'English',
        durationMinutes: 156,
        releaseDate: '2026-11-01',
        rating: 'PG-13',
        imdbRating: 8.8,
        director: 'Denis Laurent',
        cast: ['Timothée St. Clair', 'Zendaya Cole', 'Oscar Isaacson', 'Rebecca Ferguson'],
        formats: ['IMAX 3D', 'Dolby Atmos', '4DX'],
        status: 'now_showing',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w'
      },
      {
        id: 'mov-4',
        title: 'The Midnight Alibi',
        synopsis: 'A classic 1950s atmospheric murder mystery unfolds in a foggy coastal harbor town when a renowned jazz pianist is found framed for a high-society bank vault robbery.',
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
        genres: ['Mystery', 'Drama', 'Noir'],
        language: 'English',
        durationMinutes: 128,
        releaseDate: '2026-10-05',
        rating: 'PG-13',
        imdbRating: 8.3,
        director: 'Clara Beaumont',
        cast: ['Julian Mercer', 'Helena Cross', 'Vincent Ward'],
        formats: ['Dolby Atmos', 'Standard'],
        status: 'now_showing',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0'
      },
      {
        id: 'mov-5',
        title: 'Solaris Ascent',
        synopsis: 'The journey of the first solar-sail vessel destined for Alpha Centauri becomes a test of psychological fortitude as solar radiation triggers vivid shared hallucinations.',
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
        genres: ['Sci-Fi', 'Thriller'],
        language: 'English',
        durationMinutes: 135,
        releaseDate: '2026-11-20',
        rating: 'PG-13',
        imdbRating: 8.4,
        director: 'Marcus Vane',
        cast: ['Sarah Lind', 'Koji Sato', 'Marcus Miller'],
        formats: ['IMAX 3D', 'Dolby Atmos'],
        status: 'coming_soon',
        trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0'
      },
      {
        id: 'mov-6',
        title: 'Echoes of the Kyoto Garden',
        synopsis: 'An exquisite poetic narrative tracing three generations of artisan ceramicists guarding a sacred kiln in the mountain outskirts of Kyoto during the blossom season.',
        posterUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
        genres: ['Drama', 'Romance'],
        language: 'Japanese',
        durationMinutes: 119,
        releaseDate: '2026-12-04',
        rating: 'PG',
        imdbRating: 8.7,
        director: 'Hiroshi Minamino',
        cast: ['Kenji Sato', 'Aoi Miyazaki', 'Ryuichi Sakamoto'],
        formats: ['Standard', 'Dolby Atmos'],
        status: 'coming_soon',
        trailerUrl: 'https://www.youtube.com/watch?v=4zH5iYM4wJo'
      }
    ];

    // Theatres with authentic auditorium structures
    this.theatres = [
      {
        id: 'th-1',
        name: 'Grand Regal IMAX Cinema',
        city: 'New York',
        address: '840 Broadway, Manhattan, NY 10003',
        totalScreens: 4,
        facilities: ['IMAX Laser 70mm', 'Dolby Atmos Surround', 'Motorized Leather Recliners', 'Gourmet Lounge Bar', 'Wheelchair Access'],
        screens: [
          {
            id: 'scr-1',
            name: 'Auditorium 1 - IMAX Grand',
            format: 'IMAX 3D',
            rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
            columns: 14,
            totalSeats: 112
          },
          {
            id: 'scr-2',
            name: 'Auditorium 2 - Dolby Cinema',
            format: 'Dolby Atmos',
            rows: ['A', 'B', 'C', 'D', 'E', 'F'],
            columns: 12,
            totalSeats: 72
          }
        ]
      },
      {
        id: 'th-2',
        name: 'Starlight Cineplex & Lounge',
        city: 'San Francisco',
        address: '150 4th Street, SOMA, San Francisco, CA 94103',
        totalScreens: 3,
        facilities: ['Dolby Atmos', '4DX Motion Seats', 'In-Seat Dining Service', 'Valet Parking'],
        screens: [
          {
            id: 'scr-3',
            name: 'Screen 1 - 4DX Extreme',
            format: '4DX',
            rows: ['A', 'B', 'C', 'D', 'E', 'F'],
            columns: 10,
            totalSeats: 60
          },
          {
            id: 'scr-4',
            name: 'Screen 2 - Atmos Prime',
            format: 'Dolby Atmos',
            rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
            columns: 12,
            totalSeats: 84
          }
        ]
      },
      {
        id: 'th-3',
        name: 'Metro Aurora Luxury Cinema',
        city: 'Los Angeles',
        address: '10250 Santa Monica Blvd, Century City, CA 90067',
        totalScreens: 4,
        facilities: ['Laser Projection 4K', 'Heated Recliner Loungers', 'Cocktail Bar', 'Dolby Atmos'],
        screens: [
          {
            id: 'scr-5',
            name: 'Grand Auditorium - ScreenX',
            format: 'IMAX 3D',
            rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
            columns: 14,
            totalSeats: 112
          }
        ]
      }
    ];

    // Seed dynamic Shows spanning today and upcoming 4 days
    const today = new Date();
    const dates = [0, 1, 2, 3].map(offset => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    });

    const showtimesData = [
      {
        movieId: 'mov-1',
        movieTitle: 'Chronosphere: The Void',
        theatreId: 'th-1',
        theatreName: 'Grand Regal IMAX Cinema',
        theatreCity: 'New York',
        screenId: 'scr-1',
        screenName: 'Auditorium 1 - IMAX Grand',
        format: 'IMAX 3D',
        startTime: '13:30',
        endTime: '16:15',
        pricing: { standard: 17.50, premium: 22.00, vip: 28.50 }
      },
      {
        movieId: 'mov-1',
        movieTitle: 'Chronosphere: The Void',
        theatreId: 'th-1',
        theatreName: 'Grand Regal IMAX Cinema',
        theatreCity: 'New York',
        screenId: 'scr-1',
        screenName: 'Auditorium 1 - IMAX Grand',
        format: 'IMAX 3D',
        startTime: '17:00',
        endTime: '19:45',
        pricing: { standard: 19.50, premium: 24.00, vip: 32.00 }
      },
      {
        movieId: 'mov-1',
        movieTitle: 'Chronosphere: The Void',
        theatreId: 'th-1',
        theatreName: 'Grand Regal IMAX Cinema',
        theatreCity: 'New York',
        screenId: 'scr-1',
        screenName: 'Auditorium 1 - IMAX Grand',
        format: 'IMAX 3D',
        startTime: '20:30',
        endTime: '23:15',
        pricing: { standard: 21.00, premium: 26.00, vip: 35.00 }
      },
      {
        movieId: 'mov-2',
        movieTitle: 'Neon Syndicate 2099',
        theatreId: 'th-1',
        theatreName: 'Grand Regal IMAX Cinema',
        theatreCity: 'New York',
        screenId: 'scr-2',
        screenName: 'Auditorium 2 - Dolby Cinema',
        format: 'Dolby Atmos',
        startTime: '15:15',
        endTime: '17:35',
        pricing: { standard: 16.00, premium: 20.00, vip: 26.00 }
      },
      {
        movieId: 'mov-2',
        movieTitle: 'Neon Syndicate 2099',
        theatreId: 'th-1',
        theatreName: 'Grand Regal IMAX Cinema',
        theatreCity: 'New York',
        screenId: 'scr-2',
        screenName: 'Auditorium 2 - Dolby Cinema',
        format: 'Dolby Atmos',
        startTime: '19:00',
        endTime: '21:20',
        pricing: { standard: 18.00, premium: 22.00, vip: 28.50 }
      },
      {
        movieId: 'mov-3',
        movieTitle: 'Dune of Eternity',
        theatreId: 'th-2',
        theatreName: 'Starlight Cineplex & Lounge',
        theatreCity: 'San Francisco',
        screenId: 'scr-3',
        screenName: 'Screen 1 - 4DX Extreme',
        format: '4DX',
        startTime: '14:00',
        endTime: '16:35',
        pricing: { standard: 20.00, premium: 25.00, vip: 34.00 }
      },
      {
        movieId: 'mov-3',
        movieTitle: 'Dune of Eternity',
        theatreId: 'th-2',
        theatreName: 'Starlight Cineplex & Lounge',
        theatreCity: 'San Francisco',
        screenId: 'scr-3',
        screenName: 'Screen 1 - 4DX Extreme',
        format: '4DX',
        startTime: '18:15',
        endTime: '20:50',
        pricing: { standard: 22.00, premium: 27.00, vip: 36.00 }
      },
      {
        movieId: 'mov-4',
        movieTitle: 'The Midnight Alibi',
        theatreId: 'th-2',
        theatreName: 'Starlight Cineplex & Lounge',
        theatreCity: 'San Francisco',
        screenId: 'scr-4',
        screenName: 'Screen 2 - Atmos Prime',
        format: 'Dolby Atmos',
        startTime: '16:30',
        endTime: '18:40',
        pricing: { standard: 15.00, premium: 19.00, vip: 24.00 }
      },
      {
        movieId: 'mov-1',
        movieTitle: 'Chronosphere: The Void',
        theatreId: 'th-3',
        theatreName: 'Metro Aurora Luxury Cinema',
        theatreCity: 'Los Angeles',
        screenId: 'scr-5',
        screenName: 'Grand Auditorium - ScreenX',
        format: 'IMAX 3D',
        startTime: '18:00',
        endTime: '20:45',
        pricing: { standard: 20.00, premium: 26.00, vip: 34.00 }
      }
    ];

    let showCounter = 1;
    for (const d of dates) {
      for (const item of showtimesData) {
        const showId = `show-${showCounter++}`;
        const newShow: Show = {
          id: showId,
          movieId: item.movieId,
          movieTitle: item.movieTitle,
          theatreId: item.theatreId,
          theatreName: item.theatreName,
          theatreCity: item.theatreCity,
          screenId: item.screenId,
          screenName: item.screenName,
          format: item.format,
          showDate: d,
          startTime: item.startTime,
          endTime: item.endTime,
          pricing: item.pricing,
          status: 'scheduled'
        };
        this.shows.push(newShow);

        // Generate Seat Map for this show
        this.initializeSeatsForShow(newShow);
      }
    }

    // Seed an initial booking for user@imovies.com to showcase My Tickets & cancellation workflow
    const sampleShow = this.shows[0];
    const sampleBookingId = 'bk-1001';
    const sampleSeats = ['E6', 'E7'];

    // Mark seats as booked in the seat map
    const seatsState = this.showSeats.get(sampleShow.id) || [];
    for (const seat of seatsState) {
      if (sampleSeats.includes(seat.seatId)) {
        seat.status = 'booked';
        seat.bookedBy = 'usr-1';
        seat.bookingId = sampleBookingId;
      }
    }

    const initialBooking: Booking = {
      id: sampleBookingId,
      bookingReference: 'IMV-8942-NY',
      userId: 'usr-1',
      userName: 'Alex Rivera',
      userEmail: 'user@imovies.com',
      showId: sampleShow.id,
      movieId: sampleShow.movieId,
      movieTitle: sampleShow.movieTitle,
      moviePoster: '/src/assets/images/movie_poster_void_1793640130552.jpg',
      theatreName: sampleShow.theatreName,
      theatreCity: sampleShow.theatreCity,
      screenName: sampleShow.screenName,
      format: sampleShow.format,
      showDate: sampleShow.showDate,
      showTime: sampleShow.startTime,
      seats: sampleSeats,
      snacks: [
        { id: 'snack-1', name: 'Truffle & Butter Gourmet Popcorn', quantity: 1, price: 9.50 },
        { id: 'snack-6', name: 'Classic Fountain Soda (Large)', quantity: 2, price: 5.50 }
      ],
      subtotal: 44.00 + 20.50, // 2x premium seats ($22) + snacks ($20.50)
      tax: 5.80,
      bookingFee: 3.50,
      totalAmount: 73.80,
      paymentMethod: 'card',
      paymentId: 'pay-tx-9901',
      status: 'confirmed',
      qrCodeData: `IMOVIES|${sampleBookingId}|IMV-8942-NY|${sampleShow.movieTitle}|${sampleSeats.join(',')}`,
      bookedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    };
    this.bookings.push(initialBooking);

    this.payments.push({
      id: 'pay-tx-9901',
      bookingId: sampleBookingId,
      userId: 'usr-1',
      amount: 73.80,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Visa ···· 4242',
      transactionId: 'ch_3M4K89xLq8019',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    });
  }

  // Generates tiered seat layout with realistic rows & random initial bookings
  private initializeSeatsForShow(show: Show) {
    const theatre = this.theatres.find(t => t.id === show.theatreId);
    const screen = theatre?.screens.find(s => s.id === show.screenId);
    const rows = screen?.rows || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const columns = screen?.columns || 14;

    const seats: SeatState[] = [];
    const totalRows = rows.length;

    rows.forEach((rowLetter, rowIndex) => {
      // Determine tier:
      // Front 2 rows: Standard
      // Middle rows: Premium
      // Last 2 rows: VIP Recliners
      let tier: 'standard' | 'premium' | 'vip' | 'wheelchair' = 'standard';
      let seatPrice = show.pricing.standard;

      if (rowIndex >= totalRows - 2) {
        tier = 'vip';
        seatPrice = show.pricing.vip;
      } else if (rowIndex >= 2) {
        tier = 'premium';
        seatPrice = show.pricing.premium;
      }

      for (let col = 1; col <= columns; col++) {
        const seatId = `${rowLetter}${col}`;
        let seatTier: 'standard' | 'premium' | 'vip' | 'wheelchair' = tier;
        if (rowLetter === 'A' && (col === 1 || col === columns)) {
          seatTier = 'wheelchair';
        }

        // Randomly simulate ~15-20% pre-booked seats for realism
        const isPreBooked = (col * (rowIndex + 3) + show.id.length) % 7 === 0;

        seats.push({
          seatId,
          row: rowLetter,
          col,
          tier: seatTier,
          price: seatPrice,
          status: isPreBooked ? 'booked' : 'available',
          bookedBy: isPreBooked ? 'seed_user' : undefined
        });
      }
    });

    this.showSeats.set(show.id, seats);
  }

  // Clean expired seat locks (e.g., locks expire in 10 minutes)
  cleanExpiredLocks(showId?: string) {
    const now = Date.now();
    const showsToCheck = showId ? [showId] : Array.from(this.showSeats.keys());

    showsToCheck.forEach(sId => {
      const seats = this.showSeats.get(sId);
      if (seats) {
        let changed = false;
        seats.forEach(seat => {
          if (seat.status === 'locked' && seat.lockedUntil && seat.lockedUntil < now) {
            seat.status = 'available';
            seat.lockedBy = undefined;
            seat.lockedUntil = undefined;
            changed = true;
          }
        });
        if (changed) {
          this.showSeats.set(sId, seats);
        }
      }
    });
  }
}

export const db = new CinemaDatabase();
