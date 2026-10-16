// All Firestore reads/writes live here. Screens never talk to Firestore directly.
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, runTransaction, serverTimestamp, Timestamp, limit,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  applyBooking, applyCancel, applyJoinWaitlist, applyLeaveWaitlist, seatNumbers, toMs, RideError,
} from './seats.js';
import { DEFAULT_SEAT_COUNT } from '../constants/config.js';

const snap = (d) => ({ id: d.id, ...d.data() });
const list = (qs) => qs.docs.map(snap);
const bookingId = (tripId, uid) => `${tripId}_${uid}`;
const ridersOf = (seats) => Object.values(seats || {}).filter(Boolean).map((s) => s.uid);

// ---------- Auth & users ----------

export async function register({ name, email, phone, password, lang }) {
  const emailLower = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, emailLower, password);
  const uid = cred.user.uid;

  // If the admin already added a captain with this email, this account becomes that captain.
  const match = await getDocs(query(collection(db, 'captains'), where('email', '==', emailLower), limit(1)));
  const captain = match.docs[0];
  const role = captain && !captain.data().uid ? 'captain' : 'student';

  await setDoc(doc(db, 'users', uid), {
    name: name.trim(),
    email: emailLower,
    phone: phone.trim(),
    role,
    captainId: role === 'captain' ? captain.id : null,
    home: null,
    lang: lang || 'ar',
    createdAt: serverTimestamp(),
  });
  if (role === 'captain') await updateDoc(captain.ref, { uid });
  return { uid, role };
}

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim().toLowerCase());

export function watchUser(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), (d) => cb(d.exists() ? snap(d) : null));
}

export const updateProfile = (uid, data) => updateDoc(doc(db, 'users', uid), data);

// home = { latitude, longitude, address, areaId }
export const saveHome = (uid, home) => updateDoc(doc(db, 'users', uid), { home });

// ---------- Captains (drivers & cars) ----------

export function watchCaptains(cb, { activeOnly = false } = {}) {
  const q = activeOnly
    ? query(collection(db, 'captains'), where('active', '==', true))
    : query(collection(db, 'captains'));
  return onSnapshot(q, (qs) => cb(list(qs).sort((a, b) => a.name.localeCompare(b.name))));
}

export async function getCaptain(id) {
  const d = await getDoc(doc(db, 'captains', id));
  return d.exists() ? snap(d) : null;
}

export function watchCaptain(id, cb) {
  return onSnapshot(doc(db, 'captains', id), (d) => cb(d.exists() ? snap(d) : null));
}

// Admin only. data: { name, phone, email, licenseNo, photoUrl, areaIds, active, seatCount, car: {...} }
export async function saveCaptain(id, data) {
  const clean = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: (data.email || '').trim().toLowerCase(),
    licenseNo: (data.licenseNo || '').trim(),
    photoUrl: (data.photoUrl || '').trim(),
    areaIds: data.areaIds || [],
    active: data.active !== false,
    seatCount: Number(data.seatCount) || DEFAULT_SEAT_COUNT,
    car: {
      make: (data.car?.make || '').trim(),
      model: (data.car?.model || '').trim(),
      year: (data.car?.year || '').toString().trim(),
      color: (data.car?.color || '').trim(),
      plate: (data.car?.plate || '').trim(),
    },
    updatedAt: serverTimestamp(),
  };
  let captainId = id;
  if (id) {
    await updateDoc(doc(db, 'captains', id), clean);
  } else {
    const ref = await addDoc(collection(db, 'captains'), { ...clean, uid: null, createdAt: serverTimestamp() });
    captainId = ref.id;
  }
  await linkCaptainAccount(captainId, clean.email);
  return captainId;
}

// Admin: if someone already signed up with the captain's email, turn that account into the captain.
export async function linkCaptainAccount(captainId, email) {
  if (!email) return false;
  const cap = await getDoc(doc(db, 'captains', captainId));
  if (!cap.exists() || cap.data().uid) return false;
  const users = await getDocs(query(collection(db, 'users'), where('email', '==', email), limit(1)));
  const u = users.docs[0];
  if (!u || u.data().role === 'admin') return false;
  await updateDoc(u.ref, { role: 'captain', captainId });
  await updateDoc(cap.ref, { uid: u.id });
  return true;
}

export const deleteCaptain = (id) => deleteDoc(doc(db, 'captains', id));

// ---------- Trips ----------

export async function createTrip({ captain, areaId, direction, departureAt, createdBy, requestId }) {
  const seatCount = captain.seatCount || DEFAULT_SEAT_COUNT;
  const seats = Object.fromEntries(Array.from({ length: seatCount }, (_, i) => [String(i + 1), null]));
  const ref = await addDoc(collection(db, 'trips'), {
    captainId: captain.id,
    captainUid: captain.uid || null,
    captainName: captain.name,
    car: captain.car || {},
    areaId,
    direction,
    departureAt: Timestamp.fromMillis(toMs(departureAt)),
    seatCount,
    seats,
    riderUids: [],
    waitlist: [],
    waitlistUids: [],
    status: 'open',
    createdBy,
    createdAt: serverTimestamp(),
  });
  // A trip created from a student's scheduled request reserves seat 1 for that student.
  if (requestId) await acceptRequestIntoTrip(requestId, ref.id);
  return ref.id;
}

export function watchTrip(id, cb) {
  return onSnapshot(doc(db, 'trips', id), (d) => cb(d.exists() ? snap(d) : null));
}

// Upcoming open trips (all routes). Filter by area on the client.
export function watchUpcomingTrips(cb) {
  const q = query(
    collection(db, 'trips'),
    where('status', '==', 'open'),
    where('departureAt', '>=', Timestamp.fromMillis(Date.now() - 15 * 60 * 1000)),
    orderBy('departureAt', 'asc')
  );
  return onSnapshot(q, (qs) => cb(list(qs)));
}

export function watchCaptainTrips(captainId, cb, { upcomingOnly = true } = {}) {
  const parts = [where('captainId', '==', captainId)];
  if (upcomingOnly) parts.push(where('status', '==', 'open'));
  const q = query(collection(db, 'trips'), ...parts, orderBy('departureAt', upcomingOnly ? 'asc' : 'desc'));
  return onSnapshot(q, (qs) => cb(list(qs)));
}

export function watchAllTrips(cb) {
  const q = query(collection(db, 'trips'), orderBy('departureAt', 'desc'), limit(300));
  return onSnapshot(q, (qs) => cb(list(qs)));
}

export function watchMyWaitlists(uid, cb) {
  const q = query(collection(db, 'trips'), where('waitlistUids', 'array-contains', uid), where('status', '==', 'open'));
  return onSnapshot(q, (qs) => cb(list(qs)));
}

// Captain/admin: 'completed' or 'cancelled'.
export async function setTripStatus(tripId, status) {
  const tripRef = doc(db, 'trips', tripId);
  const trip = (await getDoc(tripRef)).data();
  await updateDoc(tripRef, { status, closedAt: serverTimestamp() });
  // captainId filter is required so security rules can prove the captain may read these bookings.
  const bookings = await getDocs(
    query(
      collection(db, 'bookings'),
      where('tripId', '==', tripId),
      where('captainId', '==', trip.captainId),
      where('status', '==', 'confirmed')
    )
  );
  const next = status === 'completed' ? 'completed' : 'tripCancelled';
  await Promise.all(bookings.docs.map((b) => updateDoc(b.ref, { status: next })));
}

// ---------- Booking, cancelling, waitlist (transactions = no double booking) ----------

function bookingDoc(trip, tripId, seatNo, rider, extra = {}) {
  return {
    tripId,
    riderUid: rider.uid,
    riderName: rider.name,
    riderPhone: rider.phone || '',
    home: rider.home || null,
    seatNo: String(seatNo),
    captainId: trip.captainId,
    captainName: trip.captainName,
    areaId: trip.areaId,
    direction: trip.direction,
    departureAt: trip.departureAt,
    status: 'confirmed',
    createdAt: serverTimestamp(),
    ...extra,
  };
}

export async function bookSeat(tripId, seatNo, rider) {
  const tripRef = doc(db, 'trips', tripId);
  return runTransaction(db, async (tx) => {
    const t = await tx.get(tripRef);
    if (!t.exists()) throw new RideError('TRIP_NOT_FOUND');
    const trip = t.data();
    const { seats, waitlist } = applyBooking(trip, String(seatNo), rider);
    tx.update(tripRef, {
      seats,
      riderUids: ridersOf(seats),
      waitlist,
      waitlistUids: waitlist.map((w) => w.uid),
    });
    tx.set(doc(db, 'bookings', bookingId(tripId, rider.uid)), bookingDoc(trip, tripId, seatNo, rider));
  });
}

// byStaff = captain or admin removing a rider (ignores the cancel cutoff).
export async function cancelSeat(tripId, riderUid, { byStaff = false } = {}) {
  const tripRef = doc(db, 'trips', tripId);
  return runTransaction(db, async (tx) => {
    const t = await tx.get(tripRef);
    if (!t.exists()) throw new RideError('TRIP_NOT_FOUND');
    const trip = t.data();
    const { seats, waitlist, seatNo, promoted } = applyCancel(trip, riderUid, Date.now(), { force: byStaff });
    tx.update(tripRef, {
      seats,
      riderUids: ridersOf(seats),
      waitlist,
      waitlistUids: waitlist.map((w) => w.uid),
    });
    tx.update(doc(db, 'bookings', bookingId(tripId, riderUid)), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: byStaff ? 'staff' : 'rider',
    });
    if (promoted) {
      tx.set(
        doc(db, 'bookings', bookingId(tripId, promoted.uid)),
        bookingDoc(trip, tripId, seatNo, promoted, { fromWaitlist: true })
      );
    }
    return { promoted };
  });
}

export async function joinWaitlist(tripId, rider) {
  const tripRef = doc(db, 'trips', tripId);
  return runTransaction(db, async (tx) => {
    const t = await tx.get(tripRef);
    if (!t.exists()) throw new RideError('TRIP_NOT_FOUND');
    const { waitlist } = applyJoinWaitlist(t.data(), rider);
    tx.update(tripRef, { waitlist, waitlistUids: waitlist.map((w) => w.uid) });
  });
}

export async function leaveWaitlist(tripId, uid) {
  const tripRef = doc(db, 'trips', tripId);
  return runTransaction(db, async (tx) => {
    const t = await tx.get(tripRef);
    if (!t.exists()) return;
    const { waitlist } = applyLeaveWaitlist(t.data(), uid);
    tx.update(tripRef, { waitlist, waitlistUids: waitlist.map((w) => w.uid) });
  });
}

export function watchMyBookings(uid, cb) {
  const q = query(collection(db, 'bookings'), where('riderUid', '==', uid), orderBy('departureAt', 'desc'), limit(50));
  return onSnapshot(q, (qs) => cb(list(qs)));
}

// ---------- Scheduled ride requests ----------

export async function createRequest({ rider, areaId, direction, desiredAt, note }) {
  return addDoc(collection(db, 'rideRequests'), {
    riderUid: rider.uid,
    riderName: rider.name,
    riderPhone: rider.phone || '',
    home: rider.home || null,
    areaId,
    direction,
    desiredAt: Timestamp.fromMillis(toMs(desiredAt)),
    note: (note || '').trim(),
    status: 'pending',
    tripId: null,
    createdAt: serverTimestamp(),
  });
}

export function watchMyRequests(uid, cb) {
  const q = query(collection(db, 'rideRequests'), where('riderUid', '==', uid), orderBy('desiredAt', 'desc'), limit(30));
  return onSnapshot(q, (qs) => cb(list(qs)));
}

export function watchPendingRequests(cb) {
  const q = query(
    collection(db, 'rideRequests'),
    where('status', '==', 'pending'),
    where('desiredAt', '>=', Timestamp.fromMillis(Date.now() - 60 * 60 * 1000)),
    orderBy('desiredAt', 'asc')
  );
  return onSnapshot(q, (qs) => cb(list(qs)));
}

export const cancelRequest = (id) => updateDoc(doc(db, 'rideRequests', id), { status: 'cancelled' });

// Puts the requesting student into the first free seat of an existing trip.
export async function acceptRequestIntoTrip(requestId, tripId) {
  const reqRef = doc(db, 'rideRequests', requestId);
  const tripRef = doc(db, 'trips', tripId);
  return runTransaction(db, async (tx) => {
    const [r, t] = await Promise.all([tx.get(reqRef), tx.get(tripRef)]);
    if (!r.exists() || !t.exists()) throw new RideError('TRIP_NOT_FOUND');
    const req = r.data();
    if (req.status !== 'pending') throw new RideError('REQUEST_HANDLED');
    const trip = t.data();
    const free = seatNumbers(trip).find((n) => !trip.seats?.[n]);
    if (!free) throw new RideError('TRIP_FULL');
    const rider = { uid: req.riderUid, name: req.riderName, phone: req.riderPhone, home: req.home || null };
    const { seats, waitlist } = applyBooking(trip, free, rider);
    tx.update(tripRef, { seats, riderUids: ridersOf(seats), waitlist, waitlistUids: waitlist.map((w) => w.uid) });
    tx.set(doc(db, 'bookings', bookingId(tripId, rider.uid)), bookingDoc(trip, tripId, free, rider, { fromRequest: requestId }));
    tx.update(reqRef, { status: 'accepted', tripId, captainId: trip.captainId, captainName: trip.captainName });
  });
}

// ---------- Admin ----------

export function watchUsers(cb) {
  return onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500)), (qs) => cb(list(qs)));
}

export const setUserRole = (uid, role) => updateDoc(doc(db, 'users', uid), { role });
