import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Plus, 
  Minus, 
  QrCode, 
  Download, 
  Printer, 
  ShieldCheck, 
  ArrowLeft,
  Tv,
  Calendar,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Show, Movie, SeatState, Snack, Booking, User } from '../types';
import { api } from '../api';

interface SeatBookingModalProps {
  show: Show;
  movie?: Movie;
  currentUser: User | null;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
  onRequireAuth: () => void;
}

export const SeatBookingModal: React.FC<SeatBookingModalProps> = ({
  show,
  movie,
  currentUser,
  onClose,
  onBookingComplete,
  onRequireAuth
}) => {
  const [currentStep, setCurrentStep] = useState<'seats' | 'snacks' | 'checkout' | 'confirmation'>('seats');
  const [seats, setSeats] = useState<SeatState[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [snacksCatalog, setSnacksCatalog] = useState<Snack[]>([]);
  const [selectedSnacks, setSelectedSnacks] = useState<{ [snackId: string]: number }>({});
  
  // Real-time lock tracking
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(0);
  
  // Loading & error state
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 8842');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('312');
  const [cardHolder, setCardHolder] = useState<string>(currentUser?.name || 'Alex Rivera');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial seat map and snacks
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [seatData, snacksData] = await Promise.all([
          api.getShowSeats(show.id),
          api.getSnacks()
        ]);

        if (isMounted) {
          setSeats(seatData.seats);
          setSnacksCatalog(snacksData);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load auditorium seating');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // Setup SSE or polling for live seat availability updates
    const interval = setInterval(async () => {
      try {
        const fresh = await api.getShowSeats(show.id);
        if (isMounted) {
          setSeats(fresh.seats);
        }
      } catch {
        // quiet poll
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show.id]);

  // Seat hold timer countdown
  useEffect(() => {
    if (!lockExpiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setLockTimeRemaining(remaining);

      if (remaining <= 0) {
        setErrorMessage('Seat lock expired. Please re-select your seats.');
        setSelectedSeatIds([]);
        setLockExpiresAt(null);
        if (currentStep !== 'seats' && currentStep !== 'confirmation') {
          setCurrentStep('seats');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt, currentStep]);

  // Handle seat click
  const handleToggleSeat = async (seat: SeatState) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'locked' && !selectedSeatIds.includes(seat.seatId)) return;

    setErrorMessage(null);

    const isAlreadySelected = selectedSeatIds.includes(seat.seatId);
    const newSelected = isAlreadySelected
      ? selectedSeatIds.filter(id => id !== seat.seatId)
      : [...selectedSeatIds, seat.seatId];

    if (newSelected.length > 8) {
      setErrorMessage('You can reserve a maximum of 8 seats per order.');
      return;
    }

    setSelectedSeatIds(newSelected);

    // If we have selected seats, request server lock
    if (newSelected.length > 0) {
      try {
        const lockRes = await api.lockSeats(show.id, newSelected, currentUser?.id || 'temp_guest');
        setLockExpiresAt(lockRes.lockedUntil);
      } catch (err: any) {
        setErrorMessage(err.message || 'Selected seat is no longer available');
        // revert
        setSelectedSeatIds(selectedSeatIds);
      }
    } else {
      // Release locks
      try {
        await api.unlockSeats(show.id, selectedSeatIds, currentUser?.id || 'temp_guest');
      } catch {
        // ignore
      }
      setLockExpiresAt(null);
    }
  };

  // Group seats by row
  const seatsByRow: { [row: string]: SeatState[] } = {};
  seats.forEach(s => {
    if (!seatsByRow[s.row]) seatsByRow[s.row] = [];
    seatsByRow[s.row].push(s);
  });
  const rowKeys = Object.keys(seatsByRow).sort();

  // Price calculations
  const selectedSeatsList = seats.filter(s => selectedSeatIds.includes(s.seatId));
  const ticketSubtotal = selectedSeatsList.reduce((sum, s) => sum + s.price, 0);

  let snacksSubtotal = 0;
  const snackOrderList: { id: string; quantity: number }[] = [];
  Object.entries(selectedSnacks).forEach(([sId, qty]) => {
    if (qty > 0) {
      const item = snacksCatalog.find(s => s.id === sId);
      if (item) {
        snacksSubtotal += item.price * qty;
        snackOrderList.push({ id: sId, quantity: qty });
      }
    }
  });

  const subtotal = ticketSubtotal + snacksSubtotal;
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const bookingFee = selectedSeatIds.length > 0 ? Math.round(selectedSeatIds.length * 1.50 * 100) / 100 : 0;
  const grandTotal = Math.round((subtotal + tax + bookingFee) * 100) / 100;

  // Finalize reservation
  const handleProceedToPayment = () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (selectedSeatIds.length === 0) {
      setErrorMessage('Please select at least 1 seat to proceed.');
      return;
    }
    setCurrentStep('checkout');
  };

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage(null);

      const booking = await api.createBooking({
        showId: show.id,
        seatIds: selectedSeatIds,
        snacks: snackOrderList,
        paymentMethod: paymentMethod === 'card' ? 'Credit Card' : (paymentMethod === 'upi' ? 'UPI Instant Pay' : 'Cinema Wallet'),
        paymentCardDetails: cardNumber
      });

      setConfirmedBooking(booking);
      setCurrentStep('confirmation');
      onBookingComplete(booking);

      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-left flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            {currentStep !== 'seats' && currentStep !== 'confirmation' && (
              <button
                onClick={() => setCurrentStep(currentStep === 'checkout' ? 'snacks' : 'seats')}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{show.movieTitle}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                  {show.format}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{show.theatreName} ({show.theatreCity})</span>
                <span>·</span>
                <span className="tabular-nums font-medium text-slate-300">{show.showDate}</span>
                <span>·</span>
                <span className="tabular-nums font-semibold text-amber-400">{show.startTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lock Countdown */}
            {lockTimeRemaining > 0 && currentStep !== 'confirmation' && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>Seats Held: </span>
                <span className="font-mono tabular-nums">
                  {Math.floor(lockTimeRemaining / 60)}:{(lockTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800/60 px-6 py-2.5 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading live cinema seat grid...</p>
            </div>
          ) : currentStep === 'seats' ? (
            <div className="space-y-6">
              {/* Cinema Curved Screen Visualization */}
              <div className="text-center pt-2 pb-4">
                <div className="relative mx-auto max-w-xl h-7">
                  <div className="w-full h-2.5 bg-gradient-to-r from-cyan-400/20 via-sky-300/80 to-cyan-400/20 rounded-t-full shadow-[0_-8px_24px_rgba(56,189,248,0.35)]" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-2 block">
                    Cinema Projection Screen
                  </span>
                </div>
              </div>

              {/* Seat Map Grid */}
              <div className="flex justify-center overflow-x-auto py-2">
                <div className="min-w-[540px] space-y-2">
                  {rowKeys.map(rowLetter => {
                    const rowSeats = seatsByRow[rowLetter] || [];
                    const isVIPRow = rowLetter === 'G' || rowLetter === 'H';

                    return (
                      <div key={rowLetter} className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {/* Row letter */}
                        <span className="w-5 text-xs font-bold text-slate-500 text-center select-none">
                          {rowLetter}
                        </span>

                        {/* Seats */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {rowSeats.map((seat, seatIdx) => {
                            const isSelected = selectedSeatIds.includes(seat.seatId);
                            const isBooked = seat.status === 'booked';
                            const isLocked = seat.status === 'locked' && !isSelected;

                            // Walkway gap after column 4 and column 10
                            const isAisle = seat.col === 4 || seat.col === 10;

                            let seatStyle = 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-500';
                            if (isBooked) {
                              seatStyle = 'bg-slate-950/60 border border-slate-800/40 text-slate-600 opacity-40 cursor-not-allowed';
                            } else if (isLocked) {
                              seatStyle = 'bg-orange-950/60 border border-orange-700/60 text-orange-400 animate-pulse cursor-not-allowed';
                            } else if (isSelected) {
                              seatStyle = 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-500/30 scale-105';
                            } else if (seat.tier === 'vip') {
                              seatStyle = 'bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900';
                            }

                            return (
                              <React.Fragment key={seat.seatId}>
                                <button
                                  disabled={isBooked || isLocked}
                                  onClick={() => handleToggleSeat(seat)}
                                  title={`${seat.seatId} · ${seat.tier.toUpperCase()} · $${seat.price.toFixed(2)}`}
                                  className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-t-md text-[10px] sm:text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${seatStyle}`}
                                >
                                  {seat.col}
                                </button>
                                {isAisle && <div className="w-4 sm:w-6" />}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Row letter right */}
                        <span className="w-5 text-xs font-bold text-slate-500 text-center select-none">
                          {rowLetter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier & Status Legend */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-3 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-t-sm bg-slate-800 border border-slate-700" />
                  <span>Standard (${show.pricing.standard.toFixed(2)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-t-sm bg-slate-700 border border-slate-600" />
                  <span>Premium (${show.pricing.premium.toFixed(2)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-t-sm bg-indigo-950 border border-indigo-700 text-indigo-300" />
                  <span>VIP Recliner (${show.pricing.vip.toFixed(2)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-t-sm bg-amber-400 text-slate-950 font-bold" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-t-sm bg-slate-950 border border-slate-800 opacity-40" />
                  <span>Reserved</span>
                </div>
              </div>
            </div>
          ) : currentStep === 'snacks' ? (
            /* Concessions / Snacks Step */
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Enhance Your Movie Experience</h3>
                <p className="text-xs text-slate-400">Order gourmet snacks & beverages to be waiting fresh at your seat</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {snacksCatalog.map(snack => {
                  const qty = selectedSnacks[snack.id] || 0;
                  return (
                    <div
                      key={snack.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{snack.imageUrl}</span>
                          <span className="text-sm font-bold text-amber-400 tabular-nums">
                            ${snack.price.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{snack.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{snack.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Quantity</span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={qty === 0}
                            onClick={() => setSelectedSnacks(prev => ({ ...prev, [snack.id]: Math.max(0, qty - 1) }))}
                            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => setSelectedSnacks(prev => ({ ...prev, [snack.id]: qty + 1 }))}
                            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentStep === 'checkout' ? (
            /* Checkout & Payment Step */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left 3 cols: Payment selection */}
              <div className="md:col-span-3 space-y-5">
                <h3 className="text-base font-bold text-white">Payment Method</h3>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs font-bold block">Credit / Debit</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs font-bold block">UPI / Instant</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'wallet'
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Tv className="w-5 h-5 mb-1.5 text-amber-400" />
                    <span className="text-xs font-bold block">Cinema Wallet</span>
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Expires</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                    <QrCode className="w-16 h-16 mx-auto text-amber-400" />
                    <p className="text-xs text-slate-300">
                      Scan QR code with your cinema or banking app to complete $ {grandTotal.toFixed(2)} checkout.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-bit encrypted checkout with instant digital e-ticket pass delivery</span>
                </div>
              </div>

              {/* Right 2 cols: Detailed Order Breakdown */}
              <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-3">
                    Order Summary
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Seats ({selectedSeatIds.join(', ')})</span>
                      <span className="font-semibold tabular-nums text-white">
                        ${ticketSubtotal.toFixed(2)}
                      </span>
                    </div>

                    {snacksSubtotal > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>Gourmet Concessions</span>
                        <span className="font-semibold tabular-nums text-white">
                          ${snacksSubtotal.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400">
                      <span>Taxes & Surcharge (8.875%)</span>
                      <span className="tabular-nums">${tax.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Cinema Booking Fee</span>
                      <span className="tabular-nums">${bookingFee.toFixed(2)}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-white">Total Amount</span>
                      <span className="text-xl font-extrabold text-amber-400 tabular-nums">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={processing}
                  onClick={handleConfirmBooking}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Reservation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 fill-current" />
                      <span>Authorize & Confirm (${grandTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation Step: High fidelity Digital Cinema Ticket Pass */
            confirmedBooking && (
              <div className="max-w-xl mx-auto py-4 space-y-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">Booking Confirmed!</h3>
                  <p className="text-xs text-slate-400">
                    Your seats are locked and registered. Show this e-ticket at the auditorium entrance.
                  </p>
                </div>

                {/* E-Ticket Pass Card */}
                <div className="bg-slate-950 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-left">
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-3 text-slate-950 flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-wider uppercase">
                      IMOVIES CINEMA PASS
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {confirmedBooking.bookingReference}
                    </span>
                  </div>

                  {/* Ticket Details */}
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-white tracking-tight">
                          {confirmedBooking.movieTitle}
                        </h4>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{confirmedBooking.theatreName}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                        {confirmedBooking.format}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-3 border-y border-dashed border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date</span>
                        <span className="text-xs font-bold text-slate-200 tabular-nums">
                          {confirmedBooking.showDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Time</span>
                        <span className="text-xs font-bold text-amber-400 tabular-nums">
                          {confirmedBooking.showTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Seats</span>
                        <span className="text-xs font-extrabold text-white">
                          {confirmedBooking.seats.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* QR Code & Barcode Mock */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center">
                          <QrCode className="w-14 h-14 text-slate-950" />
                        </div>
                        <div className="text-left text-xs space-y-0.5">
                          <span className="text-slate-400 block text-[11px]">Guest Name:</span>
                          <span className="text-white font-semibold block">{confirmedBooking.userName}</span>
                          <span className="text-slate-500 text-[10px] block font-mono">Total Paid: ${confirmedBooking.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Done & Return to Catalog
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer Navigation (for step 1 and 2) */}
        {currentStep === 'seats' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
            <div>
              <span className="text-xs text-slate-400 block">
                {selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'Seat' : 'Seats'} Selected
              </span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                ${ticketSubtotal.toFixed(2)}
              </span>
            </div>

            <button
              disabled={selectedSeatIds.length === 0}
              onClick={() => setCurrentStep('snacks')}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <span>Continue to Snacks</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {currentStep === 'snacks' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
            <div>
              <span className="text-xs text-slate-400 block">Subtotal (Seats + Snacks)</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
