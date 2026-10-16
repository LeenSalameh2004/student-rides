import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, ChipGroup, Muted, Subtitle } from './ui';
import DateTimeField from './DateTimeField';
import { createTrip } from '../lib/api';
import { AREAS } from '../constants/routes';
import { errorMessage } from '../i18n';

function defaultTime() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d;
}

// Create a trip for one captain. `preset` can come from a student's scheduled request.
export default function TripForm({ captain, createdBy, preset, onCreated }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const areas = AREAS.filter((a) => !captain.areaIds?.length || captain.areaIds.includes(a.id));
  const [areaId, setAreaId] = useState(preset?.areaId || areas[0]?.id || AREAS[0].id);
  const [direction, setDirection] = useState(preset?.direction || 'toUni');
  const [when, setWhen] = useState(preset?.desiredAt ? new Date(preset.desiredAt) : defaultTime());
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (when.getTime() <= Date.now()) return Alert.alert(t('schedule.past'));
    setBusy(true);
    try {
      const id = await createTrip({ captain, areaId, direction, departureAt: when, createdBy, requestId: preset?.requestId });
      Alert.alert(t('captain.created'));
      onCreated?.(id);
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Subtitle>{t('captain.newTripTitle')} — {captain.name}</Subtitle>
      <ChipGroup
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'toUni', label: `🎓 ${t('route.toUni')}` },
          { value: 'fromUni', label: `🏠 ${t('route.fromUni')}` },
        ]}
      />
      <ChipGroup value={areaId} onChange={setAreaId} options={areas.map((a) => ({ value: a.id, label: a.name[lang] }))} />
      <DateTimeField label={t('trip.departure')} value={when} onChange={setWhen} />
      <Muted style={{ marginBottom: 8 }}>{t('trip.fareNote')}</Muted>
      <Button title={t('captain.newTripTitle')} onPress={submit} loading={busy} />
    </Card>
  );
}
