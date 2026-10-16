import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Card, Empty, Muted, Row, Screen, Subtitle, Title } from '../../src/components/ui';
import TripCard from '../../src/components/TripCard';
import { useAuth } from '../../src/context/AuthContext';
import { watchMyBookings, watchMyWaitlists } from '../../src/lib/api';
import { routeLabel } from '../../src/constants/routes';
import { toMs } from '../../src/lib/seats.js';
import { colors } from '../../src/theme';
import { formatDateTime } from '../../src/i18n';

const STATUS_COLOR = {
  confirmed: colors.seatFree,
  completed: colors.primary,
  cancelled: colors.muted,
  tripCancelled: colors.danger,
};

export default function MyRides() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);

  useEffect(() => watchMyBookings(user.uid, setBookings), [user.uid]);
  useEffect(() => watchMyWaitlists(user.uid, setWaitlists), [user.uid]);

  return (
    <Screen>
      <Title>{t('tabs.myRides')}</Title>
      {bookings.length === 0 && waitlists.length === 0 ? <Empty text={t('booking.none')} /> : null}

      {waitlists.length ? <Subtitle>⏳ {t('booking.waitlists')}</Subtitle> : null}
      {waitlists.map((tr) => (
        <TripCard key={tr.id} trip={tr} uid={user.uid} onPress={() => router.push(`/student/trip/${tr.id}`)} />
      ))}

      {bookings.map((b) => (
        <Card key={b.id} onPress={() => router.push(`/student/trip/${b.tripId}`)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: colors.text, flex: 1, textAlign: 'left' }}>
              {routeLabel(b.areaId, b.direction, i18n.language)}
            </Text>
            <Badge label={t(`booking.${b.status}`)} color={STATUS_COLOR[b.status] || colors.muted} />
          </Row>
          <Muted style={{ marginTop: 4 }}>🕒 {formatDateTime(toMs(b.departureAt), i18n.language)}</Muted>
          <Muted>👤 {b.captainName} • {t('seats.seatN', { n: b.seatNo })}</Muted>
          {b.fromWaitlist ? <Badge label={t('trip.fromWaitlist')} color={colors.seatMine} /> : null}
        </Card>
      ))}
    </Screen>
  );
}
