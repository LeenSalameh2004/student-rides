import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DevSettings } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { AuthProvider } from '../src/context/AuthContext';
import { initLanguage } from '../src/i18n';
import { Loading } from '../src/components/ui';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const mustReload = await initLanguage();
      if (mustReload) {
        // First launch: flip the whole layout to RTL for Arabic.
        try {
          await Updates.reloadAsync();
        } catch {
          DevSettings.reload();
        }
        return;
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return <Loading />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
