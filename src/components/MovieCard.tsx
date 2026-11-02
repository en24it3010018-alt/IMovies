import React, { useState } from 'react';
import { Star, Clock, Ticket, Film } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onBook: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, onBook }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group flex flex-col bg-slate-900/90 rounded-xl border border-slate-800/90 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/60 text-left">
      {/* 65%-75% card height poster image container with fallback (§3.E) */}
      <div className="relative aspect-[3/4] w-full bg-slate-800 overflow-hidden cursor-pointer" onClick={() => onSelect(movie)}>
        {!imageError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center">
            <Film className="w-12 h-12 text-slate-600 mb-2" />
            <span className="text-xs font-semibold text-slate-400 line-clamp-2">{movie.title}</span>
          </div>
        )}

        {/* Subtle rating overlay */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-sm border border-slate-700/60 rounded px-2 py-0.5 flex items-center gap-1 text-xs text-amber-400 font-semibold shadow-sm">
          <Star className="w-3 h-3 fill-current" />
          <span className="tabular-nums">{movie.imdbRating.toFixed(1)}</span>
        </div>

        {/* Lead primary format */}
        {movie.formats.length > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-sm border border-slate-700/60 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-200 uppercase">
            {movie.formats[0]}
          </div>
        )}

        {/* Hover quick action */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(movie);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            <Ticket className="w-3.5 h-3.5 fill-current" />
            <span>Select Showtime</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          {/* Quiet unboxed metadata line (§1.A) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
            <span>{movie.genres[0]}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{movie.language}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {movie.durationMinutes}m
            </span>
          </div>

          <h3
            onClick={() => onSelect(movie)}
            className="text-base font-semibold text-white tracking-tight leading-snug cursor-pointer hover:text-amber-400 transition-colors line-clamp-1"
          >
            {movie.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {movie.synopsis}
          </p>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">
            {movie.rating}
          </span>
          <button
            onClick={() => onSelect(movie)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Details & Times →
          </button>
        </div>
      </div>
    </div>
  );
};
