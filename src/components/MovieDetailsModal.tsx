import React from 'react';
import { X, Play, Clock, Star, MapPin, Ticket, Shield } from 'lucide-react';
import { Movie, Show } from '../types';

interface MovieDetailsModalProps {
  movie: Movie;
  shows: Show[];
  selectedDate: string;
  onClose: () => void;
  onSelectShow: (show: Show) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  shows,
  selectedDate,
  onClose,
  onSelectShow,
  onWatchTrailer
}) => {
  // Group shows by Theatre
  const showsByTheatre: { [theatreId: string]: { theatreName: string; theatreCity: string; shows: Show[] } } = {};

  const filteredShows = shows.filter(s => s.movieId === movie.id && s.showDate === selectedDate);
  filteredShows.forEach(s => {
    if (!showsByTheatre[s.theatreId]) {
      showsByTheatre[s.theatreId] = {
        theatreName: s.theatreName,
        theatreCity: s.theatreCity,
        shows: []
      };
    }
    showsByTheatre[s.theatreId].shows.push(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl my-8 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Quick trailer action on backdrop */}
          {movie.trailerUrl && (
            <button
              onClick={() => onWatchTrailer(movie)}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-950/85 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg border border-slate-700/80 shadow-lg cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-current text-amber-400" />
              <span>Watch Trailer</span>
            </button>
          )}
        </div>

        {/* Movie Info & Details Split */}
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Poster thumbnail */}
            <div className="-mt-20 md:-mt-24 shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden shadow-xl border-2 border-slate-800 bg-slate-800">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full aspect-[3/4] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Metadata */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{movie.genres.join(', ')}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {movie.durationMinutes} min
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{movie.language}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                  {movie.rating}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="tabular-nums">{movie.imdbRating.toFixed(1)}</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {movie.synopsis}
              </p>

              {/* Cast & Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <span className="text-slate-500 font-medium">Director: </span>
                  <span className="text-slate-200 font-medium">{movie.director}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Starring: </span>
                  <span className="text-slate-200 font-medium">{movie.cast.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Showtimes Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>Available Showtimes ({selectedDate})</span>
              </h3>
            </div>

            {Object.keys(showsByTheatre).length === 0 ? (
              <div className="bg-slate-950/60 rounded-xl p-8 text-center border border-slate-800">
                <p className="text-sm text-slate-400">
                  No scheduled showtimes for this date. Try selecting another date above or check back shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(showsByTheatre).map((group) => (
                  <div
                    key={group.theatreName}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 md:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold text-white">{group.theatreName}</span>
                      </div>
                      <span className="text-xs text-slate-400">{group.theatreCity}</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {group.shows.map((show) => (
                        <button
                          key={show.id}
                          onClick={() => {
                            onClose();
                            onSelectShow(show);
                          }}
                          className="group flex flex-col items-start bg-slate-900 hover:bg-amber-400 border border-slate-700/80 hover:border-amber-400 rounded-lg px-3.5 py-2 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-slate-950 tabular-nums">
                              {show.startTime}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 group-hover:text-slate-950 bg-amber-950/50 group-hover:bg-amber-500/40 px-1 rounded">
                              {show.format}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 group-hover:text-slate-900 tabular-nums mt-0.5">
                            from ${show.pricing.standard.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
