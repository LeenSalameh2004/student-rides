import { test } from 'node:test';
import assert from 'node:assert/strict';
import { farePerRider, tripTotals, quoteForJoining, platformRevenue } from '../src/lib/pricing.js';
import {
  applyBooking, applyCancel, applyJoinWaitlist, bookedCount, isFull,
  findAlternatives, seatStatus, RideError,
} from '../src/lib/seats.js';

const HOUR = 3600 * 1000;
const now = Date.UTC(2026, 9, 18, 5, 0);

function trip(over = {}) {
  return {
    id: 't1', status: 'open', areaId: 'yadoudeh', direction: 'toUni',
    departureAt: now + 3 * HOUR, seatCount: 4,
    seats: { 1: null, 2: null, 3: null, 4: null }, waitlist: [], ...over,
  };
}
const rider = (uid) => ({ uid, name: uid.toUpperCase() });

test('pricing: 2 riders pay 3 JD each, 4 riders pay 2 JD each', () => {
  assert.equal(farePerRider(2), 3);
  assert.equal(farePerRider(4), 2);
  assert.deepEqual(
    { c: tripTotals(2).captainEarns, p: tripTotals(2).platformEarns },
    { c: 6, p: 0.5 }
  );
  assert.deepEqual(
    { c: tripTotals(4).captainEarns, p: tripTotals(4).platformEarns },
    { c: 8, p: 1 }
  );
});

test('pricing: rider pays fare + 0.25 platform fee', () => {
  assert.equal(tripTotals(2).riderPays, 3.25);
  assert.equal(tripTotals(4).riderPays, 2.25);
  assert.deepEqual(quoteForJoining(1, 4), { now: 3.25, ifFull: 2.25, fee: 0.25 });
  assert.equal(platformRevenue([{ riders: 4 }, { riders: 2 }, { riders: 3 }]), 2.25);
});

test('booking a free seat works, taken seat is rejected', () => {
  const t = trip();
  const r = applyBooking(t, '2', rider('a'), now);
  assert.equal(r.seats['2'].uid, 'a');
  const t2 = { ...t, seats: r.seats };
  assert.equal(seatStatus(t2, '2', 'a'), 'mine');
  assert.equal(seatStatus(t2, '2', 'b'), 'taken');
  assert.throws(() => applyBooking(t2, '2', rider('b'), now), (e) => e instanceof RideError && e.code === 'SEAT_TAKEN');
  assert.throws(() => applyBooking(t2, '3', rider('a'), now), (e) => e.code === 'ALREADY_BOOKED');
});

test('waitlist only when full; cancelling promotes the first in line', () => {
  let t = trip({ seats: { 1: rider('a'), 2: rider('b'), 3: null, 4: rider('d') } });
  assert.throws(() => applyJoinWaitlist(t, rider('x'), now), (e) => e.code === 'SEATS_STILL_FREE');
  t = { ...t, seats: { ...t.seats, 3: rider('c') } };
  assert.ok(isFull(t));
  t = { ...t, ...applyJoinWaitlist(t, rider('x'), now) };
  t = { ...t, ...applyJoinWaitlist(t, rider('y'), now + 1) };
  const r = applyCancel(t, 'b', now);
  assert.equal(r.seatNo, '2');
  assert.equal(r.promoted.uid, 'x');
  assert.equal(r.seats['2'].uid, 'x');
  assert.deepEqual(r.waitlist.map((w) => w.uid), ['y']);
  assert.equal(bookedCount({ ...t, seats: r.seats }), 4);
});

test('cannot cancel inside the cutoff unless forced (captain/admin)', () => {
  const t = trip({ departureAt: now + 10 * 60 * 1000, seats: { 1: rider('a'), 2: null, 3: null, 4: null } });
  assert.throws(() => applyCancel(t, 'a', now), (e) => e.code === 'TOO_LATE_TO_CANCEL');
  assert.equal(applyCancel(t, 'a', now, { force: true }).seats['1'], null);
});

test('alternatives: same route & direction, has seats, within window, nearest first', () => {
  const target = trip({ seats: { 1: rider('a'), 2: rider('b'), 3: rider('c'), 4: rider('d') } });
  const list = [
    trip({ id: 'far', departureAt: target.departureAt + 2 * HOUR }),
    trip({ id: 'near', departureAt: target.departureAt + 10 * 60 * 1000 }),
    trip({ id: 'nearer', departureAt: target.departureAt - 5 * 60 * 1000 }),
    trip({ id: 'otherArea', areaId: 'amir-rashid' }),
    trip({ id: 'back', direction: 'fromUni' }),
    trip({ id: 'full', seats: target.seats }),
  ];
  assert.deepEqual(findAlternatives(list, target, 45, now).map((t) => t.id), ['nearer', 'near']);
});
