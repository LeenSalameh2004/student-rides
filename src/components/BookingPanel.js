import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Muted, Row, Subtitle, Badge } from './ui';
import SeatMap from './SeatMap';
import TripCard from './TripCard';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { bookSeat, cancelSeat, joinWaitlist, leaveWaitlist, watchUpcomingTrips } from '../lib/api';
import { bookedCount, canCancel, findAlternatives, isFull, isWaitlisted, seatOf, toMs } from '../lib/seats.js';
import { quoteForJoining, tripTotals } from '../lib/pricing.js';
import { routeLabel } from '../constants/routes';
import { errorMessage, formatDateTime } from '../i18n';

// Seat picking, time confirmation, cancel, waitlist and alternative cars for one trip.
export default function BookingPanel({ trip }) {
  const { t, i18n } = useTranslation();
  const { rider } = useAuth();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [allTrips, setAllTrips] = useState([]);

  const mySeat = seatOf(trip, rider.uid);
  const full = isFull(trip);
  const waiting = isWaitlisted(trip, rider.uid);
  const waitPos = (trip.waitlist || []).findIndex((w) => w.uid === rider.uid) + 1;
  const time = formatDateTime(toMs(trip.departureAt), i18n.language);
  const route = routeLabel(trip.areaId, trip.direction, i18n.language);
  const open = trip.status === 'open' && toMs(trip.departureAt) > Date.now();

  // Clear a selection that someone else just booked.
  useEffect(() => {
    if (selected && trip.seats?.[selected]) setSelected(null);
  }, [trip, selected]);

  // Only load other trips when this car is full and the student needs alternatives.
  useEffect(() => {
    if (!full || mySeat) return undefined;
    return watchUpcomingTrips(setAllTrips);
  }, [full, mySeat]);

  const alternatives = useMemo(() => findAlternatives(allTrips, { ...trip }), [allTrips, trip]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) Alert.alert(okMsg);
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmBooking = () => {
    const quote = quoteForJoining(bookedCount(trip), trip.seatCount);
    Alert.alert(
      t('trip.confirmTitle'),
      t('trip.confirmBody', {
        seat: t('seats.seatN', { n: selected }),
        route,
        time,
        price: quote.now,
        ifFull: quote.ifFull,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => run(async () => {
            await bookSeat(trip.id, selected, rider);
            setSelected(null);
          }, t('trip.booked')),
        },
      ]
    );
  };

  const confirmCancel = () =>
    Alert.alert(t('trip.cancelBooking'), t('common.areYouSure'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => run(() => cancelSeat(trip.id, rider.uid), t('trip.cancelled')) },
    ]);

  const riders = bookedCount(trip);
  const quote = quoteForJoining(riders, trip.seatCount);
  const current = tripTotals(Math.max(riders, 1));

  return (
    <View>
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'left' }}>{route}</Text>
        <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '700', marginVertical: 6, textAlign: 'left' }}>
          🕒 {t('trip.departure')}: {time}
        </Text>
        <SeatMap trip={trip} uid={rider.uid} selected={selected} onSelect={open && !mySeat ? setSelected : null} />
        {open && !mySeat && !full ? <Muted style={{ textAlign: 'center', marginTop: 8 }}>{t('seats.tapToSelect')}</Muted> : null}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>{mySeat ? t('trip.price') : t('trip.priceNow')}</Muted>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>
            {mySeat ? current.riderPays : quote.now} {t('common.jd')}
          </Text>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <Muted>{t('trip.priceIfFull')}</Muted>
          <Text style={{ fontWeight: '700', color: colors.seatFree }}>{quote.ifFull} {t('common.jd')}</Text>
        </Row>
        <Muted style={{ marginTop: 6, fontSize: 12 }}>
          {t('trip.serviceFee')}: {quote.fee} {t('common.jd')}
        </Muted>
      </Card>

      {mySeat ? (
        <Card style={{ borderWidth: 2, borderColor: colors.seatMine }}>
          <Badge label={`${t('seats.yours')}: ${mySeat}`} color={colors.seatMine} />
          <Text style={{ marginTop: 8, fontWeight: '700', color: colors.text, textAlign: 'left' }}>{t('trip.booked')}</Text>
          {open && canCancel(trip) ? (
            <Button title={t('trip.cancelBooking')} variant="danger" onPress={confirmCancel} loading={busy} />
          ) : null}
        </Card>
      ) : null}

      {!mySeat && open && !full ? (
        <Button
          title={selected ? `${t('trip.book')} — ${t('seats.seatN', { n: selected })}` : t('seats.tapToSelect')}
          disabled={!selected}
          loading={busy}
          onPress={confirmBooking}
          variant="success"
        />
      ) : null}

      {!mySeat && open && full ? (
        <Card style={{ borderWidth: 2, borderColor: colors.seatTaken }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.seatTaken, textAlign: 'left' }}>🔴 {t('trip.fullTitle')}</Text>
          {waiting ? (
            <>
              <Muted style={{ marginTop: 6 }}>{t('trip.onWaitlist', { pos: waitPos })}</Muted>
              <Button title={t('trip.leaveWaitlist')} variant="secondary" loading={busy} onPress={() => run(() => leaveWaitlist(trip.id, rider.uid))} />
            </>
          ) : (
            <Button title={`⏳ ${t('trip.joinWaitlist')}`} loading={busy} onPress={() => run(() => joinWaitlist(trip.id, rider), t('trip.waitlistJoined'))} />
          )}
          <Muted style={{ marginTop: 6 }}>
            {t('trip.waitlist')}: {(trip.waitlist || []).length}
          </Muted>
        </Card>
      ) : null}

      {!mySeat && open && full ? (
        <View>
          <Subtitle>{t('trip.alternatives')}</Subtitle>
          {alternatives.length === 0 ? <Muted>{t('trip.noAlternatives')}</Muted> : null}
          {alternatives.map((alt) => (
            <TripCard key={alt.id} trip={alt} uid={rider.uid} onPress={() => router.push(`/student/trip/${alt.id}`)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
