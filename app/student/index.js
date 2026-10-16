import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, ChipGroup, Empty, LangToggle, Muted, Row, Screen, Subtitle, Title, Badge } from '../../src/components/ui';
import TripCard from '../../src/components/TripCard';
import { SeatDots } from '../../src/components/SeatMap';
import { useAuth } from '../../src/context/AuthContext';
import { watchCaptains, watchUpcomingTrips } from '../../src/lib/api';
import { AREAS } from '../../src/constants/routes';
import { isFull, toMs } from '../../src/lib/seats.js';
import { colors } from '../../src/theme';
import { formatTime } from '../../src/i18n';

export default function StudentHome() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [captains, setCaptains] = useState([]);
  const [trips, setTrips] = useState([]);
  const [area, setArea] = useState(profile?.home?.areaId || 'all');
  const [direction, setDirection] = useState('toUni');

  useEffect(() => watchCaptains(setCaptains, { activeOnly: true }), []);
  useEffect(() => watchUpcomingTrips(setTrips), []);

  const visible = useMemo(
    () =>
      trips.filter(
        (tr) => toMs(tr.departureAt) > Date.now() && tr.direction === direction && (area === 'all' || tr.areaId === area)
      ),
    [trips, area, direction]
  );

  const shownCaptains = captains.filter((c) => area === 'all' || (c.areaIds || []).includes(area));

  return (
    <Screen>
      <LangToggle />
      <Title>{t('appName')}</Title>
      <Muted style={{ marginBottom: 12 }}>{t('trip.fareNote')}</Muted>

      <ChipGroup
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'toUni', label: `🎓 ${t('route.toUni')}` },
          { value: 'fromUni', label: `🏠 ${t('route.fromUni')}` },
        ]}
      />
      <ChipGroup
        value={area}
        onChange={setArea}
        options={[{ value: 'all', label: t('route.all') }, ...AREAS.map((a) => ({ value: a.id, label: a.name[lang] }))]}
      />

      <Subtitle>{t('tabs.captains')}</Subtitle>
      {shownCaptains.length === 0 ? <Empty text={t('common.none')} /> : null}
      {shownCaptains.map((c) => {
        const next = visible.find((tr) => tr.captainId === c.id);
        return (
          <Card key={c.id} onPress={() => router.push(`/student/captain/${c.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'left' }}>👤 {c.name}</Text>
                <Muted>
                  🚗 {[c.car?.make, c.car?.model, c.car?.color].filter(Boolean).join(' ')}
                  {c.car?.plate ? `  •  ${c.car.plate}` : ''}
                </Muted>
              </View>
              {next ? (
                <Badge
                  label={isFull(next) ? t('seats.full') : formatTime(toMs(next.departureAt), i18n.language)}
                  color={isFull(next) ? colors.seatTaken : colors.seatFree}
                />
              ) : null}
            </Row>
            {next ? (
              <View style={{ marginTop: 10 }}>
                <SeatDots trip={next} uid={user.uid} />
              </View>
            ) : null}
            <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 8, textAlign: 'left' }}>
              {t('trip.viewCaptain')} ›
            </Text>
          </Card>
        );
      })}

      <Subtitle>{t('trip.upcoming')}</Subtitle>
      {visible.length === 0 ? <Empty text={t('trip.noTrips')} /> : null}
      {visible.map((tr) => (
        <TripCard key={tr.id} trip={tr} uid={user.uid} onPress={() => router.push(`/student/trip/${tr.id}`)} />
      ))}
    </Screen>
  );
}
