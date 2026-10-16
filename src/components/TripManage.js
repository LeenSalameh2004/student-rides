import { Alert, Linking, Text, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Muted, Row, Subtitle } from './ui';
import SeatMap from './SeatMap';
import { colors } from '../theme';
import { cancelSeat, setTripStatus } from '../lib/api';
import { bookedCount, seatNumbers, toMs } from '../lib/seats.js';
import { tripTotals } from '../lib/pricing.js';
import { routeLabel } from '../constants/routes';
import { errorMessage, formatDateTime } from '../i18n';

export function openInMaps(home) {
  if (!home) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${home.latitude},${home.longitude}`;
  Linking.openURL(url);
}

// Captain/admin view of one trip: passengers, pickup points, waitlist, money, close trip.
export default function TripManage({ trip }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const riders = bookedCount(trip);
  const totals = tripTotals(riders);
  const isOpen = trip.status === 'open';

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const ask = (title, fn) =>
    Alert.alert(title, t('common.areYouSure'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => run(fn) },
    ]);

  return (
    <View>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'left' }}>
            {routeLabel(trip.areaId, trip.direction, i18n.language)}
          </Text>
          <Badge
            label={isOpen ? t('trip.open') : trip.status === 'completed' ? t('trip.completed') : t('trip.statusCancelled')}
            color={isOpen ? colors.seatFree : colors.muted}
          />
        </Row>
        <Text style={{ color: colors.primary, fontWeight: '700', marginVertical: 6, textAlign: 'left' }}>
          🕒 {formatDateTime(toMs(trip.departureAt), i18n.language)}
        </Text>
        <SeatMap trip={trip} uid={null} showNames />
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>{t('trip.riders')}</Muted>
          <Text style={{ fontWeight: '800' }}>{riders} / {trip.seatCount}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <Muted>{t('trip.price')} ({t('roles.captain')})</Muted>
          <Text style={{ fontWeight: '800' }}>{totals.farePerRider} {t('common.jd')} × {riders} = {totals.captainEarns} {t('common.jd')}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <Muted>{t('trip.serviceFee')}</Muted>
          <Text style={{ fontWeight: '700', color: colors.accent }}>{totals.platformEarns} {t('common.jd')}</Text>
        </Row>
      </Card>

      <Subtitle>{t('trip.passengers')}</Subtitle>
      {seatNumbers(trip).map((n) => {
        const s = trip.seats?.[n];
        if (!s) return null;
        return (
          <Card key={n}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: colors.text, textAlign: 'left' }}>{t('seats.seatN', { n })}: {s.name}</Text>
              {s.phone ? <Muted>{s.phone}</Muted> : null}
            </Row>
            {s.home?.address ? <Muted>🏠 {s.home.address}</Muted> : null}
            <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>
              {s.phone ? <Button small variant="secondary" title={`📞 ${t('common.call')}`} onPress={() => Linking.openURL(`tel:${s.phone}`)} /> : null}
              {s.home ? <Button small variant="secondary" title={`📍 ${t('trip.openInMaps')}`} onPress={() => openInMaps(s.home)} /> : null}
              {isOpen ? (
                <Button small variant="ghost" title={t('trip.removeRider')} onPress={() => ask(t('trip.removeRider'), () => cancelSeat(trip.id, s.uid, { byStaff: true }))} />
              ) : null}
            </Row>
          </Card>
        );
      })}

      {(trip.waitlist || []).length ? (
        <>
          <Subtitle>⏳ {t('trip.waitlist')}</Subtitle>
          <Card>
            {trip.waitlist.map((w, i) => (
              <Muted key={w.uid}>{i + 1}. {w.name} {w.phone ? `• ${w.phone}` : ''}</Muted>
            ))}
          </Card>
        </>
      ) : null}

      {isOpen ? (
        <>
          <Button title={`✅ ${t('trip.complete')}`} variant="success" loading={busy} onPress={() => ask(t('trip.complete'), () => setTripStatus(trip.id, 'completed'))} />
          <Button title={t('trip.cancelTrip')} variant="danger" loading={busy} onPress={() => ask(t('trip.cancelTrip'), () => setTripStatus(trip.id, 'cancelled'))} />
        </>
      ) : null}
    </View>
  );
}
