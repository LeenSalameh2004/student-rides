import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { watchUser } from '../lib/api';

const AuthContext = createContext({ user: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, (u) => {
      stopProfile();
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      // Right after sign-up the profile doc may not exist yet; wait for it, but not forever.
      const giveUp = setTimeout(() => setLoading(false), 8000);
      const stopUser = watchUser(u.uid, (p) => {
        setProfile(p);
        if (p) {
          clearTimeout(giveUp);
          setLoading(false);
        }
      });
      stopProfile = () => {
        clearTimeout(giveUp);
        stopUser();
      };
    });
    return () => {
      stopProfile();
      stopAuth();
    };
  }, []);

  // Rider object used by booking functions.
  const rider = user && profile ? { uid: user.uid, name: profile.name, phone: profile.phone, home: profile.home } : null;

  return <AuthContext.Provider value={{ user, profile, rider, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
