import React, { useState } from 'react';
import { MapPin, Film, Sparkles, Clock, Ticket } from 'lucide-react';
import { Theatre, Show, Movie } from '../types';

interface CinemasViewProps {
  theatres: Theatre[];
  shows: Show[];
  movies: Movie[];
  onSelectShow: (show: Show) => void;
}

export const CinemasView: React.FC<CinemasViewProps> = ({
  theatres,
  shows,
  movies,
  onSelectShow
}) => {
  const [selectedTheatreId, setSelectedTheatreId] = useState<string>(theatres[0]?.id || '');

  const activeTheatre = theatres.find(t => t.id === selectedTheatreId) || theatres[0];
  const theatreShows = shows.filter(s => s.theatreId === activeTheatre?.id);

  // Group shows by Movie
  const showsByMovie: { [movieId: string]: { movie: Movie | undefined; shows: Show[] } } = {};
  theatreShows.forEach(s => {
    if (!showsByMovie[s.movieId]) {
      showsByMovie[s.movieId] = {
        movie: movies.find(m => m.id === s.movieId),
        shows: []
      };
    }
    showsByMovie[s.movieId].shows.push(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          IMovies Cinema Locations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore our premier auditoriums equipped with IMAX Laser, Dolby Atmos, and luxury recliner lounges.
        </p>
      </div>

      {/* Theatre Selector Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {theatres.map(theatre => (
          <button
            key={theatre.id}
            onClick={() => setSelectedTheatreId(theatre.id)}
            className={`px-4 py-2.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
              activeTheatre?.id === theatre.id
                ? 'bg-amber-400/10 border-amber-400 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-bold block">{theatre.name}</span>
            <span className="text-[11px] text-slate-400 block">{theatre.city}</span>
          </button>
        ))}
      </div>

      {activeTheatre && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cinema Details Left Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                Flagship Venue
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{activeTheatre.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{activeTheatre.address}</span>
              </div>
            </div>

            {/* Auditoriums & Formats */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Auditoriums</h3>
              <div className="space-y-2">
                {activeTheatre.screens.map(screen => (
                  <div key={screen.id} className="bg-slate-950 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">{screen.name}</span>
                      <span className="text-[11px] text-slate-400">{screen.totalSeats} Recliner Seats</span>
                    </div>
                    <span className="font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">
                      {screen.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Venue Amenities</h3>
              <div className="flex flex-wrap gap-1.5">
                {activeTheatre.facilities.map((fac, idx) => (
                  <span key={idx} className="text-[11px] text-slate-300 bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 rounded-md">
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Shows Right Section */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              <span>Now Playing at {activeTheatre.name}</span>
            </h3>

            {Object.keys(showsByMovie).length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                No active showtimes currently scheduled for this location.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(showsByMovie).map(group => {
                  if (!group.movie) return null;
                  return (
                    <div
                      key={group.movie.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={group.movie.posterUrl}
                          alt={group.movie.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 space-y-2.5">
                        <div>
                          <h4 className="text-base font-bold text-white">{group.movie.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{group.movie.genres.join(', ')}</span>
                            <span>·</span>
                            <span>{group.movie.durationMinutes} min</span>
                            <span>·</span>
                            <span className="text-amber-400 font-semibold">{group.movie.rating}</span>
                          </div>
                        </div>

                        {/* Showtimes buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {group.shows.map(show => (
                            <button
                              key={show.id}
                              onClick={() => onSelectShow(show)}
                              className="group flex flex-col items-start bg-slate-950 hover:bg-amber-400 border border-slate-800 hover:border-amber-400 rounded-lg px-3 py-1.5 transition-all cursor-pointer text-left"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-slate-950 tabular-nums">
                                  {show.startTime}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-amber-400 group-hover:text-slate-950">
                                  {show.format}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 group-hover:text-slate-900 tabular-nums">
                                ${show.pricing.standard}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
