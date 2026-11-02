import React from 'react';
import { X, Play } from 'lucide-react';
import { Movie } from '../types';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  // Extract embed code or YouTube id
  const getEmbedUrl = (url?: string) => {
    if (!url) return 'https://www.youtube-nocookie.com/embed/zSWdZVtXT7E?autoplay=1';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-left">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 fill-current text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {movie.title} — Official Theatrical Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={getEmbedUrl(movie.trailerUrl)}
            title={`${movie.title} Trailer`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
