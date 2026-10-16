import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Row, Badge, Muted } from './ui';
import { SeatDots } from './SeatMap';
import { colors } from '../theme';
import { routeLabel } from '../constants/routes';
import { freeCount, isFull, toMs, bookedCount } from '../lib/seats.js';
import { quoteForJoining } from '../lib/pricing.js';
import { formatDateTime } from '../i18n';

export function seatsLeftText(t, trip) {
  const n = freeCount(trip);
  if (n <= 0) return t('seats.full');
  return n === 1 ? t('seats.leftOne') : t('seats.left', { n });
}

export default function TripCard({ trip, uid, onPress, showCaptain = true, footer }) {
  const { t, i18n } = useTranslation();
  const full = isFull(trip);
  const quote = quoteForJoining(bookedCount(trip), trip.seatCount);
  const status = trip.status !== 'open'
    ? { label: trip.status === 'completed' ? t('trip.completed') : t('trip.statusCancelled'), color: colors.muted }
    : full
      ? { label: t('seats.full'), color: colors.seatTaken }
      : { label: seatsLeftText(t, trip), color: colors.seatFree };

  return (
    <Card onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'left' }}>
            {routeLabel(trip.areaId, trip.direction, i18n.language)}
          </Text>
          <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '700', marginTop: 4, textAlign: 'left' }}>
            🕒 {formatDateTime(toMs(trip.departureAt), i18n.language)}
          </Text>
        </View>
        <Badge label={status.label} color={status.color} />
      </Row>
      {showCaptain ? (
        <Muted style={{ marginTop: 8 }}>
          👤 {trip.captainName}
          {trip.car?.model ? `  •  🚗 ${[trip.car.make, trip.car.model].filter(Boolean).join(' ')} ${trip.car.color || ''}` : ''}
        </Muted>
      ) : null}
      <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <SeatDots trip={trip} uid={uid} />
        {trip.status === 'open' && !full ? (
          <Text style={{ fontWeight: '800', color: colors.text }}>
            {quote.now} {t('common.jd')}
          </Text>
        ) : null}
      </Row>
      {footer}
    </Card>
  );
}
