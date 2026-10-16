import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Empty, Loading, Muted, Row, Screen, Title } from '../../src/components/ui';
import { useMyCaptain } from '../../src/lib/hooks';
import { acceptRequestIntoTrip, watchCaptainTrips, watchPendingRequests } from '../../src/lib/api';
import { openInMaps } from '../../src/components/TripManage';
import { routeLabel } from '../../src/constants/routes';
import { isFull, toMs } from '../../src/lib/seats.js';
import { colors } from '../../src/theme';
import { errorMessage, formatDateTime, formatTime } from '../../src/i18n';

// Students' scheduled ride requests in this captain's areas.
export default function Requests() {
  const { t, i18n } = useTranslation();
  const captain = useMyCaptain();
  const [requests, setRequests] = useState([]);
  const [trips, setTrips] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => watchPendingRequests(setRequests), []);
  useEffect(() => (captain ? watchCaptainTrips(captain.id, setTrips) : undefined), [captain?.id]);

  const mine = useMemo(
    () => requests.filter((r) => !captain?.areaIds?.length || captain.areaIds.includes(r.areaId)),
    [requests, captain]
  );

  if (captain === undefined) return <Loading />;
  if (!captain) return <Screen><Card><Muted>{t('captain.notLinked')}</Muted></Card></Screen>;

  const addTo = async (reqId, tripId) => {
    try {
      await acceptRequestIntoTrip(reqId, tripId);
      Alert.alert(t('schedule.accepted'));
      setOpenId(null);
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  };

  return (
    <Screen>
      <Title>{t('tabs.requests')}</Title>
      {mine.length === 0 ? <Empty text={t('captain.noRequests')} /> : null}
      {mine.map((r) => {
        const matching = trips.filter((tr) => tr.areaId === r.areaId && tr.direction === r.direction && !isFull(tr));
        return (
          <Card key={r.id}>
            <Text style={{ fontWeight: '800', color: colors.text, textAlign: 'left' }}>{routeLabel(r.areaId, r.direction, i18n.language)}</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4, textAlign: 'left' }}>
              🕒 {formatDateTime(toMs(r.desiredAt), i18n.language)}
            </Text>
            <Muted>👤 {r.riderName} {r.riderPhone ? `• ${r.riderPhone}` : ''}</Muted>
            {r.home?.address ? <Muted>🏠 {r.home.address}</Muted> : null}
            {r.note ? <Muted>📝 {r.note}</Muted> : null}
            <Row style={{ flexWrap: 'wrap', marginTop: 8 }}>
              {r.home ? <Button small variant="secondary" title={`📍 ${t('captain.studentHome')}`} onPress={() => openInMaps(r.home)} /> : null}
              <Button
                small
                title={t('captain.fromRequest')}
                onPress={() =>
                  router.push({
                    pathname: '/captain/new-trip',
                    params: { requestId: r.id, areaId: r.areaId, direction: r.direction, desiredAt: String(toMs(r.desiredAt)) },
                  })
                }
              />
              {matching.length ? (
                <Button small variant="secondary" title={t('captain.addToTrip')} onPress={() => setOpenId(openId === r.id ? null : r.id)} />
              ) : null}
            </Row>
            {openId === r.id ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {matching.map((tr) => (
                  <Chip key={tr.id} label={formatTime(toMs(tr.departureAt), i18n.language)} onPress={() => addTo(r.id, tr.id)} />
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
