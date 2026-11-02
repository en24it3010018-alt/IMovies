import React from 'react';
import { Play, Ticket, Sparkles, Volume2, Clock, Star } from 'lucide-react';
import { Movie } from '../types';

interface HeroBannerProps {
  movie: Movie;
  onBookTickets: (movie: Movie) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onBookTickets,
  onWatchTrailer
}) => {
  return (
    <section className="relative w-full overflow-hidden bg-slate-950 border-b border-slate-800">
      {/* Background with measured contrast scrim (§1.F) */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdropUrl || '/src/assets/images/hero_cinema_imax_1793640129618.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left Column: Headline and movie details */}
        <div className="w-full md:w-3/5 space-y-5 text-left">
          {/* Quiet unboxed metadata line (§1.A) */}
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-slate-300">
            <span className="text-amber-400 font-semibold tracking-wide uppercase text-[11px]">
              Cinema Premiere
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{movie.genres.join(', ')}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {movie.durationMinutes} min
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200">
              {movie.rating}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-semibold tabular-nums">{movie.imdbRating.toFixed(1)}</span>
            </span>
          </div>

          {/* Balanced Display Headline (§1.D) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
            {movie.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-none">
            {movie.synopsis}
          </p>

          {/* Experience Formats & Audio */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {movie.formats.map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-bold tracking-wider text-slate-200 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded"
              >
                {fmt}
              </span>
            ))}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 pl-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              Spatial Audio Mix
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => onBookTickets(movie)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer text-sm whitespace-nowrap shrink-0 active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4 fill-current" />
              <span>Book Seats Now</span>
            </button>

            {movie.trailerUrl && (
              <button
                onClick={() => onWatchTrailer(movie)}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-medium border border-slate-700 rounded-lg transition-colors cursor-pointer text-sm whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current text-amber-400" />
                <span>Watch Trailer</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Key Poster Preview */}
        <div className="w-full md:w-2/5 flex justify-center md:justify-end">
          <div className="relative group w-48 sm:w-56 md:w-64 rounded-xl overflow-hidden shadow-2xl shadow-slate-950/80 border border-slate-700/60 bg-slate-900 transform transition-transform group-hover:scale-[1.02]">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full aspect-[3/4] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <button
                onClick={() => onBookTickets(movie)}
                className="w-full py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded shadow cursor-pointer text-center"
              >
                Quick Reserve
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
