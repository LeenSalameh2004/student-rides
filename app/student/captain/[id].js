import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Empty, Loading, Muted, Row, Screen, Subtitle, Title } from '../../../src/components/ui';
import BookingPanel from '../../../src/components/BookingPanel';
import { watchCaptain, watchCaptainTrips } from '../../../src/lib/api';
import { areaById } from '../../../src/constants/routes';
import { isFull, toMs } from '../../../src/lib/seats.js';
import { colors } from '../../../src/theme';
import { formatDateTime } from '../../../src/i18n';

// Captain profile: driver & car details, then every upcoming trip with its colour-coded seat map.
export default function CaptainProfile() {
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [captain, setCaptain] = useState(undefined);
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(null);

  useEffect(() => watchCaptain(String(id), setCaptain), [id]);
  useEffect(() => watchCaptainTrips(String(id), setTrips), [id]);

  const upcoming = useMemo(() => trips.filter((tr) => toMs(tr.departureAt) > Date.now()), [trips]);
  const current = upcoming.find((tr) => tr.id === tripId) || upcoming[0] || null;

  if (captain === undefined) return <Loading />;
  if (!captain) return <Screen><Empty text={t('errors.unknown')} /></Screen>;

  const car = captain.car || {};
  return (
    <Screen>
      <Button title={`‹ ${t('common.back')}`} variant="ghost" small onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <Card>
        <Row gap={14}>
          {captain.photoUrl ? (
            <Image source={{ uri: captain.photoUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
          ) : (
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 34 }}>👤</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Title style={{ marginBottom: 0 }}>{captain.name}</Title>
            <Muted>{t('roles.captain')} • {(captain.areaIds || []).map((a) => areaById(a)?.name[lang]).filter(Boolean).join('، ')}</Muted>
          </View>
        </Row>
        <View style={{ marginTop: 12, gap: 4 }}>
          <Muted>🚗 {t('trip.car')}: {[car.make, car.model, car.year].filter(Boolean).join(' ')}</Muted>
          <Muted>🎨 {t('admin.color')}: {car.color || '—'}</Muted>
          <Muted>🔢 {t('trip.plate')}: {car.plate || '—'}</Muted>
        </View>
        {captain.phone ? (
          <Button title={`📞 ${t('common.call')} ${captain.phone}`} variant="secondary" small onPress={() => Linking.openURL(`tel:${captain.phone}`)} />
        ) : null}
      </Card>

      <Subtitle>{t('trip.upcoming')}</Subtitle>
      {upcoming.length === 0 ? <Empty text={t('trip.noTrips')} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {upcoming.map((tr) => (
          <Chip
            key={tr.id}
            label={`${isFull(tr) ? '🔴' : '🟢'} ${formatDateTime(toMs(tr.departureAt), i18n.language)}`}
            selected={current?.id === tr.id}
            onPress={() => setTripId(tr.id)}
          />
        ))}
      </View>
      {current ? <BookingPanel key={current.id} trip={current} /> : null}
    </Screen>
  );
}
