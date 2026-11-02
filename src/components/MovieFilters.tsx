import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';

interface MovieFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
  selectedFormat: string;
  setSelectedFormat: (f: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  genres: string[];
  formats: string[];
  dates: { label: string; dateStr: string }[];
}

export const MovieFilters: React.FC<MovieFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  selectedFormat,
  setSelectedFormat,
  selectedDate,
  setSelectedDate,
  genres,
  formats,
  dates
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Top filter row: Search & Date Pills */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input with clear button */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies, cast, directors..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Segmented Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Calendar className="w-4 h-4 text-slate-400 mr-1 shrink-0 hidden sm:block" />
          {dates.map((item) => (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDate(item.dateStr)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedDate === item.dateStr
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filter row: Genre & Format tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        {/* Genre buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs text-slate-400 font-medium mr-1.5 shrink-0">Genre:</span>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-slate-800 text-amber-400 border border-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Format buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-medium mr-1.5 shrink-0">Format:</span>
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedFormat === fmt
                  ? 'bg-slate-800 text-amber-400 border border-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
