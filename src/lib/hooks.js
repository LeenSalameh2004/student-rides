import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { watchCaptain, watchTrip } from './api';

// The captain record (driver + car) linked to the logged-in captain account.
// undefined = loading, null = not linked.
export function useMyCaptain() {
  const { profile } = useAuth();
  const [captain, setCaptain] = useState(undefined);
  useEffect(() => {
    if (!profile?.captainId) {
      setCaptain(null);
      return undefined;
    }
    return watchCaptain(profile.captainId, setCaptain);
  }, [profile?.captainId]);
  return captain;
}

export function useTrip(id) {
  const [trip, setTrip] = useState(undefined);
  useEffect(() => (id ? watchTrip(String(id), setTrip) : undefined), [id]);
  return trip;
}
