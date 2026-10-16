// Business configuration. Change values here, not inside screens.

export const CURRENCY = 'JD';

// Fare each rider pays the captain, chosen by how many riders are in the car.
// From the brief: 2 riders -> 3 JD each, 4 riders -> 2 JD each.
// Assumed (not in the brief): 1 rider pays like 2 (3 JD), 3 riders pay like 4 (2 JD),
// so a captain never earns less when another student joins.
export const FARE_TIERS = [
  { maxRiders: 2, fare: 3 },
  { maxRiders: 4, fare: 2 },
];

// 100% of fares go to the captain. The platform earns a fixed fee per student per trip.
export const PLATFORM_FEE_PER_RIDER = 0.25;

// Seats offered to students in a standard car (driver excluded).
export const DEFAULT_SEAT_COUNT = 4;

// How far (minutes) from the requested time a trip still counts as an alternative car.
export const ALTERNATIVE_WINDOW_MINUTES = 45;

// How long before departure a student may still cancel.
export const CANCEL_CUTOFF_MINUTES = 30;
