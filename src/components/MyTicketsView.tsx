import React, { useState } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  X,
  ExternalLink 
} from 'lucide-react';
import { Booking, User } from '../types';
import { api } from '../api';

interface MyTicketsViewProps {
  currentUser: User | null;
  bookings: Booking[];
  onRefreshBookings: () => void;
  onOpenAuth: () => void;
  onBrowseMovies: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  currentUser,
  bookings,
  onRefreshBookings,
  onOpenAuth,
  onBrowseMovies
}) => {
  const [ticketFilter, setTicketFilter] = useState<'all' | 'upcoming' | 'cancelled'>('upcoming');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Booking | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-amber-400">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Access Your Cinema Bookings</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sign in to view your digital ticket passes, seat reservations, and manage cancellations.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(b => {
    if (ticketFilter === 'cancelled') return b.status === 'cancelled';
    if (ticketFilter === 'upcoming') return b.status === 'confirmed' && b.showDate >= todayStr;
    return true;
  });

  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Are you sure you want to cancel booking for ${booking.movieTitle}? A nominal $2 processing fee applies.`)) {
      return;
    }

    try {
      setCancellingBookingId(booking.id);
      setActionError(null);
      await api.cancelBooking(booking.id);
      setActionSuccess(`Booking ${booking.bookingReference} has been cancelled and refunded.`);
      onRefreshBookings();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6 text-left">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Tickets & Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered passes for {currentUser.name} ({currentUser.email})
          </p>
        </div>

        {/* Filter Segmented Control (§1.A) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setTicketFilter('upcoming')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              ticketFilter === 'upcoming'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTicketFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              ticketFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setTicketFilter('cancelled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              ticketFilter === 'cancelled'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Refunded / Cancelled
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any {ticketFilter === 'upcoming' ? 'upcoming' : ''} reservations. Browse our latest premieres and choose your seats!
          </p>
          <button
            onClick={onBrowseMovies}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Browse Movies Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => {
            const isCancelled = booking.status === 'cancelled';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left: Movie poster & basic info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-22 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                    <img
                      src={booking.moviePoster}
                      alt={booking.movieTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {booking.bookingReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                          isCancelled
                            ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                            : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                        }`}
                      >
                        {isCancelled ? 'Cancelled' : 'Confirmed'}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded">
                        {booking.format}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {booking.movieTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {booking.theatreName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 tabular-nums font-medium text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {booking.showDate}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 tabular-nums font-semibold text-amber-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {booking.showTime}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 pt-0.5">
                      <span className="text-slate-500">Reserved Seats: </span>
                      <span className="font-bold text-white">{booking.seats.join(', ')}</span>
                      {booking.snacks.length > 0 && (
                        <span className="text-slate-400 ml-2">
                          (+ {booking.snacks.map(s => `${s.quantity}x ${s.name}`).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Paid</span>
                    <span className="text-base font-extrabold text-white tabular-nums">
                      ${booking.totalAmount.toFixed(2)}
                    </span>
                    {isCancelled && booking.refundAmount !== undefined && (
                      <span className="text-[10px] text-emerald-400 block tabular-nums">
                        Refunded: ${booking.refundAmount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTicketForModal(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>E-Ticket</span>
                    </button>

                    {!isCancelled && (
                      <button
                        disabled={cancellingBookingId === booking.id}
                        onClick={() => handleCancelBooking(booking)}
                        className="px-3 py-1.5 text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancellingBookingId === booking.id ? 'Refunding...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* E-Ticket Modal preview */}
      {selectedTicketForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-left">
            <button
              onClick={() => setSelectedTicketForModal(null)}
              className="absolute top-3 right-3 z-10 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-gradient-to-r from-amber-500 to-rose-600 px-5 py-3 text-slate-950 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">IMOVIES ADMISSION PASS</span>
              <span className="text-xs font-mono font-bold">{selectedTicketForModal.bookingReference}</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTicketForModal.movieTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTicketForModal.theatreName}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-dashed border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date</span>
                  <span className="text-xs font-bold text-slate-200">{selectedTicketForModal.showDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Time</span>
                  <span className="text-xs font-bold text-amber-400">{selectedTicketForModal.showTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Seats</span>
                  <span className="text-xs font-bold text-white">{selectedTicketForModal.seats.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="bg-white p-2 rounded-lg">
                  <QrCode className="w-28 h-28 text-slate-950" />
                </div>
              </div>

              <div className="text-center text-xs text-slate-400">
                <span>Pass Status: </span>
                <span className={`font-bold ${selectedTicketForModal.status === 'confirmed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedTicketForModal.status.toUpperCase()}
                </span>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
