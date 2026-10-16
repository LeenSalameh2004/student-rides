import { FARE_TIERS, PLATFORM_FEE_PER_RIDER } from '../constants/config.js';

const round = (n) => Math.round(n * 100) / 100;

// Fare per rider (paid to the captain) for a car carrying `riders` students.
export function farePerRider(riders) {
  if (!Number.isFinite(riders) || riders < 1) return FARE_TIERS[0].fare;
  const tier = FARE_TIERS.find((t) => riders <= t.maxRiders);
  return (tier || FARE_TIERS[FARE_TIERS.length - 1]).fare;
}

// Full breakdown for a trip with `riders` students.
export function tripTotals(riders) {
  const n = Math.max(0, Math.floor(riders || 0));
  const fare = farePerRider(Math.max(n, 1));
  return {
    riders: n,
    farePerRider: fare,
    feePerRider: PLATFORM_FEE_PER_RIDER,
    riderPays: round(fare + PLATFORM_FEE_PER_RIDER),
    captainEarns: round(fare * n), // all fares go to the captain
    platformEarns: round(PLATFORM_FEE_PER_RIDER * n), // 0.25 per student
  };
}

// What a student joining now would pay, and the best case if the car fills.
export function quoteForJoining(currentRiders, seatCount) {
  const after = tripTotals(currentRiders + 1);
  const full = tripTotals(seatCount);
  return { now: after.riderPays, ifFull: full.riderPays, fee: PLATFORM_FEE_PER_RIDER };
}

// Platform revenue across many trips: [{riders}] -> total JD.
export function platformRevenue(trips) {
  return round(trips.reduce((sum, t) => sum + tripTotals(t.riders).platformEarns, 0));
}
