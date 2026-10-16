// Pure seat / waitlist logic. No Firebase here so it can be unit-tested and
// reused inside Firestore transactions (src/lib/api.js).
import { ALTERNATIVE_WINDOW_MINUTES, CANCEL_CUTOFF_MINUTES } from '../constants/config.js';

export class RideError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // translated in the UI via t(`errors.${code}`)
  }
}

export function seatNumbers(trip) {
  return Array.from({ length: trip.seatCount || 0 }, (_, i) => String(i + 1));
}

export function bookedCount(trip) {
  return seatNumbers(trip).filter((n) => trip.seats?.[n]).length;
}

export function freeCount(trip) {
  return (trip.seatCount || 0) - bookedCount(trip);
}

export function isFull(trip) {
  return freeCount(trip) <= 0;
}

export function seatOf(trip, uid) {
  return seatNumbers(trip).find((n) => trip.seats?.[n]?.uid === uid) || null;
}

// 'mine' | 'taken' | 'free'
export function seatStatus(trip, seatNo, uid) {
  const s = trip.seats?.[seatNo];
  if (!s) return 'free';
  return s.uid === uid ? 'mine' : 'taken';
}

export function isWaitlisted(trip, uid) {
  return (trip.waitlist || []).some((w) => w.uid === uid);
}

// What we store per seat / waitlist entry: who, how to call them, where to pick them up.
function seatEntry(r) {
  return { uid: r.uid, name: r.name, phone: r.phone || '', home: r.home || null };
}

function assertOpen(trip, nowMs) {
  if (trip.status !== 'open') throw new RideError('TRIP_CLOSED');
  if (toMs(trip.departureAt) <= nowMs) throw new RideError('TRIP_DEPARTED');
}

// Returns the updated { seats, waitlist } after `rider` takes `seatNo`.
export function applyBooking(trip, seatNo, rider, nowMs = Date.now()) {
  assertOpen(trip, nowMs);
  if (!seatNumbers(trip).includes(String(seatNo))) throw new RideError('SEAT_INVALID');
  if (seatOf(trip, rider.uid)) throw new RideError('ALREADY_BOOKED');
  if (trip.seats?.[seatNo]) throw new RideError('SEAT_TAKEN');
  return {
    seats: { ...trip.seats, [seatNo]: seatEntry(rider) },
    waitlist: (trip.waitlist || []).filter((w) => w.uid !== rider.uid),
  };
}

export function applyJoinWaitlist(trip, rider, nowMs = Date.now()) {
  assertOpen(trip, nowMs);
  if (seatOf(trip, rider.uid)) throw new RideError('ALREADY_BOOKED');
  if (!isFull(trip)) throw new RideError('SEATS_STILL_FREE');
  if (isWaitlisted(trip, rider.uid)) return { waitlist: trip.waitlist };
  return {
    waitlist: [...(trip.waitlist || []), { ...seatEntry(rider), at: nowMs }],
  };
}

export function applyLeaveWaitlist(trip, uid) {
  return { waitlist: (trip.waitlist || []).filter((w) => w.uid !== uid) };
}

export function canCancel(trip, nowMs = Date.now()) {
  return toMs(trip.departureAt) - nowMs >= CANCEL_CUTOFF_MINUTES * 60 * 1000;
}

// Frees the rider's seat and gives it to the first student on the waitlist.
// Returns { seats, waitlist, seatNo, promoted } where promoted is the waitlist entry or null.
export function applyCancel(trip, uid, nowMs = Date.now(), { force = false } = {}) {
  const seatNo = seatOf(trip, uid);
  if (!seatNo) throw new RideError('NOT_BOOKED');
  if (!force && !canCancel(trip, nowMs)) throw new RideError('TOO_LATE_TO_CANCEL');
  const queue = [...(trip.waitlist || [])].sort((a, b) => a.at - b.at);
  const promoted = queue.shift() || null;
  const seats = { ...trip.seats, [seatNo]: promoted ? seatEntry(promoted) : null };
  return { seats, waitlist: queue, seatNo, promoted };
}

// Other open cars on the same route & direction close to the wanted time,
// with free seats, nearest time first.
export function findAlternatives(trips, target, windowMinutes = ALTERNATIVE_WINDOW_MINUTES, nowMs = Date.now()) {
  const wanted = toMs(target.departureAt);
  const windowMs = windowMinutes * 60 * 1000;
  return trips
    .filter(
      (t) =>
        t.id !== target.id &&
        t.status === 'open' &&
        t.areaId === target.areaId &&
        t.direction === target.direction &&
        toMs(t.departureAt) > nowMs &&
        Math.abs(toMs(t.departureAt) - wanted) <= windowMs &&
        !isFull(t)
    )
    .sort((a, b) => Math.abs(toMs(a.departureAt) - wanted) - Math.abs(toMs(b.departureAt) - wanted));
}

// Accepts a Firestore Timestamp, Date, or millis.
export function toMs(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  return new Date(v).getTime();
}
