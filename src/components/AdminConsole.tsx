import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  Ticket, 
  Film, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  X,
  Clock,
  MapPin
} from 'lucide-react';
import { AdminStats, Movie, Show, Theatre, Booking } from '../types';
import { api } from '../api';

interface AdminConsoleProps {
  onRefreshCatalog: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onRefreshCatalog }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'movies' | 'shows' | 'theatres' | 'bookings'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Movie Modal State
  const [showAddMovieModal, setShowAddMovieModal] = useState<boolean>(false);
  const [movieForm, setMovieForm] = useState({
    title: '',
    synopsis: '',
    posterUrl: '/src/assets/images/movie_poster_void_1793640130552.jpg',
    backdropUrl: '/src/assets/images/hero_cinema_imax_1793640129618.jpg',
    genres: 'Sci-Fi, Action',
    language: 'English',
    durationMinutes: 140,
    rating: 'PG-13',
    imdbRating: 8.5,
    director: 'Christopher Nolan',
    cast: 'Cillian Murphy, Emily Blunt, Matt Damon',
    formats: 'IMAX 3D, Dolby Atmos, Standard',
    status: 'now_showing',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w'
  });

  // Schedule Show Modal State
  const [showAddShowModal, setShowAddShowModal] = useState<boolean>(false);
  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    showDate: new Date().toISOString().split('T')[0],
    startTime: '19:30',
    format: 'IMAX 3D',
    standardPrice: 18.00,
    premiumPrice: 24.00,
    vipPrice: 32.00
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, moviesData, showsData, theatresData, bookingsData] = await Promise.all([
        api.getAdminStats(),
        api.getMovies(),
        api.getShows(),
        api.getTheatres(),
        api.getAdminBookings()
      ]);

      setStats(statsData);
      setMovies(moviesData);
      setShows(showsData);
      setTheatres(theatresData);
      setAllBookings(bookingsData);

      if (moviesData.length > 0 && theatresData.length > 0 && !showForm.movieId) {
        setShowForm(prev => ({
          ...prev,
          movieId: moviesData[0].id,
          theatreId: theatresData[0].id,
          screenId: theatresData[0].screens[0]?.id || ''
        }));
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMovie({
        title: movieForm.title,
        synopsis: movieForm.synopsis,
        posterUrl: movieForm.posterUrl,
        backdropUrl: movieForm.backdropUrl,
        genres: movieForm.genres.split(',').map(g => g.trim()),
        language: movieForm.language,
        durationMinutes: Number(movieForm.durationMinutes),
        rating: movieForm.rating,
        imdbRating: Number(movieForm.imdbRating),
        director: movieForm.director,
        cast: movieForm.cast.split(',').map(c => c.trim()),
        formats: movieForm.formats.split(',').map(f => f.trim()),
        status: movieForm.status as any,
        trailerUrl: movieForm.trailerUrl
      });

      setShowAddMovieModal(false);
      setToastMessage('Movie registered successfully!');
      loadAdminData();
      onRefreshCatalog();
    } catch (err: any) {
      alert(err.message || 'Error creating movie');
    }
  };

  const handleDeleteMovie = async (movieId: string, title: string) => {
    if (!window.confirm(`Delete movie "${title}" and all its scheduled shows?`)) return;
    try {
      await api.deleteMovie(movieId);
      setToastMessage(`Movie "${title}" removed.`);
      loadAdminData();
      onRefreshCatalog();
    } catch (err: any) {
      alert(err.message || 'Error deleting movie');
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShow({
        movieId: showForm.movieId,
        theatreId: showForm.theatreId,
        screenId: showForm.screenId,
        showDate: showForm.showDate,
        startTime: showForm.startTime,
        format: showForm.format,
        pricing: {
          standard: Number(showForm.standardPrice),
          premium: Number(showForm.premiumPrice),
          vip: Number(showForm.vipPrice)
        }
      });

      setShowAddShowModal(false);
      setToastMessage('Showtime scheduled successfully!');
      loadAdminData();
      onRefreshCatalog();
    } catch (err: any) {
      alert(err.message || 'Error scheduling show');
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!window.confirm('Cancel and delete this showtime?')) return;
    try {
      await api.deleteShow(showId);
      setToastMessage('Showtime deleted.');
      loadAdminData();
      onRefreshCatalog();
    } catch (err: any) {
      alert(err.message || 'Error deleting show');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6 text-left">
      {/* Admin Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cinema Operations Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management for movie schedules, auditoriums, tickets, and revenue metrics.
          </p>
        </div>

        {/* Tab Controls (§1.A) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'movies' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'shows' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Showtimes ({shows.length})
          </button>
          <button
            onClick={() => setActiveTab('theatres')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'theatres' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Theatres ({theatres.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bookings Ledger ({allBookings.length})
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab: Analytics & KPIs */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* KPI 4-column metric strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Total Box Office</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-400">Net after refunds</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Tickets Issued</span>
                <Ticket className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {stats.totalTickets}
              </div>
              <span className="text-[11px] text-slate-400">{stats.confirmedBookingsCount} active bookings</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Avg Occupancy</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {stats.averageOccupancyPercentage}%
              </div>
              <span className="text-[11px] text-sky-400">Auditorium seat fill rate</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Active Shows</span>
                <Film className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {stats.totalScheduledShows}
              </div>
              <span className="text-[11px] text-slate-400">Across {stats.totalTheatres} cinemas</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Top Grossing Movies</span>
              </h3>
              <div className="space-y-3">
                {stats.popularMovies.length === 0 ? (
                  <p className="text-xs text-slate-500">No ticket sales recorded yet.</p>
                ) : (
                  stats.popularMovies.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div>
                        <span className="font-semibold text-white block">{m.title}</span>
                        <span className="text-slate-400 text-[11px]">{m.tickets} tickets sold</span>
                      </div>
                      <span className="font-bold text-amber-400 font-mono tabular-nums">
                        ${m.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Theatre Performance</span>
              </h3>
              <div className="space-y-3">
                {stats.theatrePerformance.length === 0 ? (
                  <p className="text-xs text-slate-500">No theatre activity logged yet.</p>
                ) : (
                  stats.theatrePerformance.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div>
                        <span className="font-semibold text-white block">{t.name}</span>
                        <span className="text-slate-400 text-[11px]">{t.bookings} bookings</span>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono tabular-nums">
                        ${t.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Movies Management */}
      {activeTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Movie Catalogue Management</h2>
            <button
              onClick={() => setShowAddMovieModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Movie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map(movie => (
              <div
                key={movie.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{movie.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{movie.genres.join(', ')}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{movie.durationMinutes}m</span>
                      <span>·</span>
                      <span className="text-amber-400 font-semibold">{movie.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{movie.status.replace('_', ' ')}</span>
                    <button
                      onClick={() => handleDeleteMovie(movie.id, movie.title)}
                      className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                      title="Delete Movie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Showtimes Scheduling */}
      {activeTab === 'shows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Auditorium Showtimes Schedule</h2>
            <button
              onClick={() => setShowAddShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Show</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Cinema & Screen</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Tier Pricing</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {shows.map(show => (
                  <tr key={show.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">{show.movieTitle}</td>
                    <td className="py-3 px-4">
                      <span>{show.theatreName}</span>
                      <span className="text-[11px] text-slate-400 block">{show.screenName}</span>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <span>{show.showDate}</span>
                      <span className="text-amber-400 font-semibold block">{show.startTime}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-200">
                        {show.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      ${show.pricing.standard} / ${show.pricing.premium} / ${show.pricing.vip}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteShow(show.id)}
                        className="text-rose-400 hover:text-white p-1 rounded hover:bg-rose-950/50 cursor-pointer"
                        title="Delete Show"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Theatres */}
      {activeTab === 'theatres' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Cinemas & Auditoriums</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theatres.map(theatre => (
              <div key={theatre.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{theatre.name}</h3>
                  <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    {theatre.city}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{theatre.address}</p>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">Screens & Sound Formats:</span>
                  <div className="space-y-1.5">
                    {theatre.screens.map(scr => (
                      <div key={scr.id} className="bg-slate-950 px-3 py-2 rounded-lg flex items-center justify-between text-xs text-slate-300">
                        <span className="font-medium">{scr.name}</span>
                        <span className="text-amber-400 font-semibold">{scr.format} · {scr.totalSeats} Seats</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {theatre.facilities.map((fac, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Bookings Ledger */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Master Reservations Ledger</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Movie & Theatre</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {allBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{b.bookingReference}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{b.userName}</span>
                      <span className="text-[11px] text-slate-400 block">{b.userEmail}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{b.movieTitle}</span>
                      <span className="text-[11px] text-slate-400 block">{b.theatreName}</span>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <span>{b.showDate}</span>
                      <span className="text-slate-400 block">{b.showTime}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{b.seats.join(', ')}</td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-white">${b.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : 'bg-rose-950/60 border-rose-800 text-rose-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Movie to Catalogue</h3>
              <button onClick={() => setShowAddMovieModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Movie Title</label>
                <input
                  required
                  type="text"
                  value={movieForm.title}
                  onChange={e => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Blade Runner 2049"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Synopsis</label>
                <textarea
                  required
                  rows={3}
                  value={movieForm.synopsis}
                  onChange={e => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.genres}
                    onChange={e => setMovieForm({ ...movieForm, genres: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Language</label>
                  <input
                    type="text"
                    value={movieForm.language}
                    onChange={e => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={movieForm.durationMinutes}
                    onChange={e => setMovieForm({ ...movieForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rating</label>
                  <input
                    type="text"
                    value={movieForm.rating}
                    onChange={e => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">IMDb Score</label>
                  <input
                    type="number"
                    step="0.1"
                    value={movieForm.imdbRating}
                    onChange={e => setMovieForm({ ...movieForm, imdbRating: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Director & Cast</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Director"
                    value={movieForm.director}
                    onChange={e => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Cast (comma separated)"
                    value={movieForm.cast}
                    onChange={e => setMovieForm({ ...movieForm, cast: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {showAddShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Schedule New Showtime</h3>
              <button onClick={() => setShowAddShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShow} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={e => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Select Cinema & Screen</label>
                <select
                  value={showForm.theatreId}
                  onChange={e => {
                    const th = theatres.find(t => t.id === e.target.value);
                    setShowForm({
                      ...showForm,
                      theatreId: e.target.value,
                      screenId: th?.screens[0]?.id || ''
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {theatres.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Show Date</label>
                  <input
                    type="date"
                    value={showForm.showDate}
                    onChange={e => setShowForm({ ...showForm, showDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={showForm.startTime}
                    onChange={e => setShowForm({ ...showForm, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Experience Format</label>
                <select
                  value={showForm.format}
                  onChange={e => setShowForm({ ...showForm, format: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="IMAX 3D">IMAX 3D</option>
                  <option value="Dolby Atmos">Dolby Atmos</option>
                  <option value="4DX">4DX</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Standard ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={showForm.standardPrice}
                    onChange={e => setShowForm({ ...showForm, standardPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Premium ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={showForm.premiumPrice}
                    onChange={e => setShowForm({ ...showForm, premiumPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">VIP Recliner ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={showForm.vipPrice}
                    onChange={e => setShowForm({ ...showForm, vipPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Schedule Showtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
