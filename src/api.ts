import { User, Movie, Theatre, Show, SeatState, Snack, Booking, AdminStats } from './types';

const TOKEN_KEY = 'imovies_auth_token';
const USER_KEY = 'imovies_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetchJson<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return { user: res.user, token: res.token };
  },

  async register(name: string, email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<{ user: User; token: string }> {
    const res = await fetchJson<{ success: boolean; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return { user: res.user, token: res.token };
  },

  async getMe(): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>('/api/auth/me');
    authStorage.setUser(res.user);
    return res.user;
  },

  logout() {
    authStorage.clear();
  },

  // Movies
  async getMovies(params: { genre?: string; language?: string; search?: string; status?: string; format?: string } = {}): Promise<Movie[]> {
    const query = new URLSearchParams();
    if (params.genre && params.genre !== 'All') query.set('genre', params.genre);
    if (params.language && params.language !== 'All') query.set('language', params.language);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.format && params.format !== 'All') query.set('format', params.format);
    if (params.search) query.set('search', params.search);

    const res = await fetchJson<{ success: boolean; movies: Movie[] }>(`/api/movies?${query.toString()}`);
    return res.movies;
  },

  async getMovieDetails(id: string): Promise<{ movie: Movie; upcomingShows: Show[] }> {
    return fetchJson<{ success: boolean; movie: Movie; upcomingShows: Show[] }>(`/api/movies/${id}`);
  },

  async createMovie(movieData: Partial<Movie>): Promise<Movie> {
    const res = await fetchJson<{ success: boolean; movie: Movie }>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(movieData)
    });
    return res.movie;
  },

  async updateMovie(id: string, movieData: Partial<Movie>): Promise<Movie> {
    const res = await fetchJson<{ success: boolean; movie: Movie }>(`/api/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData)
    });
    return res.movie;
  },

  async deleteMovie(id: string): Promise<void> {
    await fetchJson<{ success: boolean }>(`/api/movies/${id}`, {
      method: 'DELETE'
    });
  },

  // Theatres
  async getTheatres(city?: string): Promise<Theatre[]> {
    const query = city && city !== 'All' ? `?city=${encodeURIComponent(city)}` : '';
    const res = await fetchJson<{ success: boolean; theatres: Theatre[] }>(`/api/theatres${query}`);
    return res.theatres;
  },

  // Shows
  async getShows(params: { movieId?: string; theatreId?: string; date?: string; city?: string } = {}): Promise<Show[]> {
    const query = new URLSearchParams();
    if (params.movieId) query.set('movieId', params.movieId);
    if (params.theatreId) query.set('theatreId', params.theatreId);
    if (params.date) query.set('date', params.date);
    if (params.city && params.city !== 'All') query.set('city', params.city);

    const res = await fetchJson<{ success: boolean; shows: Show[] }>(`/api/shows?${query.toString()}`);
    return res.shows;
  },

  async getShowDetails(id: string): Promise<{ show: Show; movie?: Movie; theatre?: Theatre }> {
    return fetchJson<{ success: boolean; show: Show; movie?: Movie; theatre?: Theatre }>(`/api/shows/${id}`);
  },

  async createShow(showData: any): Promise<Show> {
    const res = await fetchJson<{ success: boolean; show: Show }>('/api/shows', {
      method: 'POST',
      body: JSON.stringify(showData)
    });
    return res.show;
  },

  async deleteShow(id: string): Promise<void> {
    await fetchJson<{ success: boolean }>(`/api/shows/${id}`, {
      method: 'DELETE'
    });
  },

  // Seats
  async getShowSeats(showId: string): Promise<{
    seats: SeatState[];
    stats: { total: number; available: number; booked: number; locked: number; occupancyPercentage: number };
  }> {
    return fetchJson<{
      success: boolean;
      seats: SeatState[];
      stats: { total: number; available: number; booked: number; locked: number; occupancyPercentage: number };
    }>(`/api/shows/${showId}/seats`);
  },

  async lockSeats(showId: string, seatIds: string[], lockHolderId?: string): Promise<{ lockedSeats: string[]; lockedUntil: number }> {
    return fetchJson<{ success: boolean; lockedSeats: string[]; lockedUntil: number }>(`/api/shows/${showId}/lock-seats`, {
      method: 'POST',
      body: JSON.stringify({ seatIds, lockHolderId })
    });
  },

  async unlockSeats(showId: string, seatIds: string[], lockHolderId?: string): Promise<void> {
    await fetchJson<{ success: boolean }>(`/api/shows/${showId}/unlock-seats`, {
      method: 'POST',
      body: JSON.stringify({ seatIds, lockHolderId })
    });
  },

  // Concessions
  async getSnacks(): Promise<Snack[]> {
    const res = await fetchJson<{ success: boolean; snacks: Snack[] }>('/api/snacks');
    return res.snacks;
  },

  // Bookings
  async getUserBookings(status?: string): Promise<Booking[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetchJson<{ success: boolean; bookings: Booking[] }>(`/api/bookings${query}`);
    return res.bookings;
  },

  async createBooking(bookingPayload: {
    showId: string;
    seatIds: string[];
    snacks?: { id: string; quantity: number }[];
    paymentMethod: string;
    paymentCardDetails?: string;
  }): Promise<Booking> {
    const res = await fetchJson<{ success: boolean; booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload)
    });
    return res.booking;
  },

  async cancelBooking(bookingId: string): Promise<Booking> {
    const res = await fetchJson<{ success: boolean; booking: Booking; message: string }>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST'
    });
    return res.booking;
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetchJson<{ success: boolean; stats: AdminStats }>('/api/admin/stats');
    return res.stats;
  },

  async getAdminBookings(params: { status?: string; showId?: string } = {}): Promise<Booking[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.showId) query.set('showId', params.showId);

    const res = await fetchJson<{ success: boolean; bookings: Booking[] }>(`/api/admin/bookings?${query.toString()}`);
    return res.bookings;
  }
};
