import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Empty, LangToggle, Loading, Muted, Screen, Stat, Subtitle, Title } from '../../src/components/ui';
import TripCard from '../../src/components/TripCard';
import { useMyCaptain } from '../../src/lib/hooks';
import { watchCaptainTrips } from '../../src/lib/api';
import { bookedCount, toMs } from '../../src/lib/seats.js';
import { tripTotals } from '../../src/lib/pricing.js';
import { colors } from '../../src/theme';

export default function CaptainHome() {
  const { t } = useTranslation();
  const captain = useMyCaptain();
  const [trips, setTrips] = useState([]);

  useEffect(() => (captain ? watchCaptainTrips(captain.id, setTrips, { upcomingOnly: false }) : undefined), [captain?.id]);

  const { open, earned, owed } = useMemo(() => {
    const done = trips.filter((tr) => tr.status === 'completed');
    return {
      open: trips.filter((tr) => tr.status === 'open').sort((a, b) => toMs(a.departureAt) - toMs(b.departureAt)),
      earned: done.reduce((s, tr) => s + tripTotals(bookedCount(tr)).captainEarns, 0),
      owed: done.reduce((s, tr) => s + tripTotals(bookedCount(tr)).platformEarns, 0),
    };
  }, [trips]);

  if (captain === undefined) return <Loading />;
  if (captain === null) {
    return (
      <Screen>
        <Card><Muted>{t('captain.notLinked')}</Muted></Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <LangToggle />
      <Title>👋 {captain.name}</Title>
      <Muted>🚗 {[captain.car?.make, captain.car?.model, captain.car?.color, captain.car?.plate].filter(Boolean).join(' • ')}</Muted>
      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14, flexWrap: 'wrap' }}>
        <Stat label={t('captain.earningsDone')} value={`${earned.toFixed(2)} ${t('common.jd')}`} color={colors.seatFree} />
        <Stat label={t('captain.feesOwed')} value={`${owed.toFixed(2)} ${t('common.jd')}`} color={colors.accent} />
      </View>
      <Subtitle>{t('trip.upcoming')}</Subtitle>
      {open.length === 0 ? <Empty text={t('captain.noOpenTrips')} /> : null}
      {open.map((tr) => (
        <TripCard key={tr.id} trip={tr} uid={null} showCaptain={false} onPress={() => router.push(`/captain/trip/${tr.id}`)} />
      ))}
    </Screen>
  );
}
