import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Button, Muted } from './ui';
import { colors, radius } from '../theme';
import { AMMAN_REGION, AREAS, UNIVERSITY } from '../constants/routes';

// Google Map where the student drops a pin on their exact home entrance.
export default function LocationPicker({ value, onChange, height = 320 }) {
  const { t, i18n } = useTranslation();
  const mapRef = useRef(null);
  const [locating, setLocating] = useState(false);

  const initial = value
    ? { latitude: value.latitude, longitude: value.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : AMMAN_REGION;

  const set = (coords) => onChange({ latitude: coords.latitude, longitude: coords.longitude });

  const useMine = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profile.locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set(pos.coords);
      mapRef.current?.animateToRegion(
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        600
      );
    } catch (e) {
      Alert.alert(t('common.error'), e?.message);
    } finally {
      setLocating(false);
    }
  };

  const lang = i18n.language === 'en' ? 'en' : 'ar';

  return (
    <View>
      <Muted style={{ marginBottom: 8 }}>{t('profile.homeHint')}</Muted>
      <View style={[styles.wrap, { height }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={initial}
          onPress={(e) => set(e.nativeEvent.coordinate)}
          showsUserLocation
          toolbarEnabled={false}
        >
          {/* Reference pins for the operational area */}
          <Marker coordinate={UNIVERSITY.coords} title={UNIVERSITY.name[lang]} pinColor="blue" />
          {AREAS.map((a) => (
            <Marker
              key={a.id}
              coordinate={a.coords}
              title={a.name[lang]}
              description={a.landmark ? a.landmark[lang] : undefined}
              pinColor="green"
            />
          ))}
          {value ? (
            <Marker
              coordinate={{ latitude: value.latitude, longitude: value.longitude }}
              draggable
              onDragEnd={(e) => set(e.nativeEvent.coordinate)}
              title={t('profile.home')}
              pinColor={colors.accent}
            />
          ) : null}
        </MapView>
      </View>
      <Button title={`📍 ${t('profile.useMyLocation')}`} variant="secondary" onPress={useMine} loading={locating} />
    </View>
  );
}

// Which operational area is closest to a point (straight-line distance).
export function nearestAreaId(point) {
  if (!point) return null;
  let best = null;
  let bestD = Infinity;
  for (const a of AREAS) {
    const d = (a.coords.latitude - point.latitude) ** 2 + (a.coords.longitude - point.longitude) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a.id;
    }
  }
  return best;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
});
