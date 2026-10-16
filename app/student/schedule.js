import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, ChipGroup, Field, Muted, Row, Screen, Subtitle, Title } from '../../src/components/ui';
import DateTimeField from '../../src/components/DateTimeField';
import { useAuth } from '../../src/context/AuthContext';
import { cancelRequest, createRequest, watchMyRequests } from '../../src/lib/api';
import { AREAS, routeLabel } from '../../src/constants/routes';
import { toMs } from '../../src/lib/seats.js';
import { colors } from '../../src/theme';
import { errorMessage, formatDateTime } from '../../src/i18n';

function nextSlot() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const { rider, profile } = useAuth();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [areaId, setAreaId] = useState(profile?.home?.areaId || AREAS[0].id);
  const [direction, setDirection] = useState('toUni');
  const [when, setWhen] = useState(nextSlot());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState([]);

  useEffect(() => watchMyRequests(rider.uid, setMine), [rider.uid]);

  const submit = async () => {
    if (!profile?.home) {
      Alert.alert(t('schedule.needHome'));
      return router.push('/student/profile');
    }
    if (when.getTime() <= Date.now()) return Alert.alert(t('schedule.past'));
    setBusy(true);
    try {
      await createRequest({ rider, areaId, direction, desiredAt: when, note });
      setNote('');
      Alert.alert(t('schedule.sent'));
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const statusColor = { pending: colors.accent, accepted: colors.seatFree, cancelled: colors.muted };

  return (
    <Screen>
      <Title>{t('schedule.title')}</Title>
      <Muted style={{ marginBottom: 12 }}>{t('schedule.subtitle')}</Muted>
      <Card>
        <ChipGroup
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'toUni', label: `🎓 ${t('route.toUni')}` },
            { value: 'fromUni', label: `🏠 ${t('route.fromUni')}` },
          ]}
        />
        <ChipGroup value={areaId} onChange={setAreaId} options={AREAS.map((a) => ({ value: a.id, label: a.name[lang] }))} />
        <DateTimeField label={`${t('schedule.date')} / ${t('schedule.time')}`} value={when} onChange={setWhen} />
        <Field label={t('schedule.note')} value={note} onChangeText={setNote} multiline />
        <Button title={t('schedule.submit')} onPress={submit} loading={busy} />
      </Card>

      <Subtitle>{t('schedule.mine')}</Subtitle>
      {mine.map((r) => (
        <Card key={r.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: colors.text, flex: 1, textAlign: 'left' }}>
              {routeLabel(r.areaId, r.direction, i18n.language)}
            </Text>
            <Badge label={t(`schedule.${r.status}`)} color={statusColor[r.status] || colors.muted} />
          </Row>
          <Muted style={{ marginTop: 4 }}>🕒 {formatDateTime(toMs(r.desiredAt), i18n.language)}</Muted>
          {r.status === 'accepted' && r.captainName ? <Muted>{t('schedule.acceptedBy', { name: r.captainName })}</Muted> : null}
          {r.status === 'accepted' && r.tripId ? (
            <Button title={t('trip.viewCaptain')} variant="secondary" small onPress={() => router.push(`/student/trip/${r.tripId}`)} />
          ) : null}
          {r.status === 'pending' ? (
            <Button title={t('common.cancel')} variant="ghost" small onPress={() => cancelRequest(r.id).catch((e) => Alert.alert(errorMessage(e)))} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
