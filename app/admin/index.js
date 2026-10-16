import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, LangToggle, Muted, Row, Screen, Stat, Subtitle, Title } from '../../src/components/ui';
import { logout, watchAllTrips, watchCaptains, watchUsers } from '../../src/lib/api';
import { bookedCount } from '../../src/lib/seats.js';
import { tripTotals } from '../../src/lib/pricing.js';
import { colors } from '../../src/theme';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [trips, setTrips] = useState([]);

  useEffect(() => watchUsers(setUsers), []);
  useEffect(() => watchCaptains(setCaptains), []);
  useEffect(() => watchAllTrips(setTrips), []);

  const stats = useMemo(() => {
    const done = trips.filter((tr) => tr.status === 'completed');
    const perCaptain = {};
    let riders = 0;
    let revenue = 0;
    let captainEarnings = 0;
    for (const tr of done) {
      const tot = tripTotals(bookedCount(tr));
      riders += tot.riders;
      revenue += tot.platformEarns;
      captainEarnings += tot.captainEarns;
      const p = (perCaptain[tr.captainId] ||= { name: tr.captainName, trips: 0, riders: 0, earned: 0, owed: 0 });
      p.trips += 1;
      p.riders += tot.riders;
      p.earned += tot.captainEarns;
      p.owed += tot.platformEarns;
    }
    return {
      students: users.filter((u) => u.role === 'student').length,
      done: done.length,
      riders,
      revenue,
      captainEarnings,
      perCaptain: Object.values(perCaptain),
    };
  }, [users, trips]);

  const jd = (n) => `${n.toFixed(2)} ${t('common.jd')}`;

  return (
    <Screen>
      <LangToggle />
      <Title>{t('tabs.dashboard')}</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat label={t('admin.revenue')} value={jd(stats.revenue)} color={colors.accent} />
        <Stat label={t('admin.captainEarnings')} value={jd(stats.captainEarnings)} color={colors.seatFree} />
        <Stat label={t('admin.students')} value={stats.students} />
        <Stat label={t('admin.captains')} value={captains.length} />
        <Stat label={t('admin.tripsDone')} value={stats.done} />
        <Stat label={t('admin.ridersDone')} value={stats.riders} />
      </View>
      <Muted style={{ marginTop: 10 }}>{t('trip.fareNote')}</Muted>

      <Subtitle>{t('admin.perCaptain')}</Subtitle>
      {stats.perCaptain.map((p) => (
        <Card key={p.name}>
          <Text style={{ fontWeight: '800', color: colors.text, textAlign: 'left' }}>👤 {p.name}</Text>
          <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
            <Muted>{t('admin.tripsDone')}: {p.trips} • {t('admin.ridersDone')}: {p.riders}</Muted>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <Muted>{t('admin.captainEarnings')}: {jd(p.earned)}</Muted>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{t('captain.feesOwed')}: {jd(p.owed)}</Text>
          </Row>
        </Card>
      ))}
      <Button title={t('common.logout')} variant="ghost" onPress={logout} />
    </Screen>
  );
}
