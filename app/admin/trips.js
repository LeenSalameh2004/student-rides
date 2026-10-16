import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChipGroup, Empty, Screen, Title } from '../../src/components/ui';
import TripCard from '../../src/components/TripCard';
import { watchAllTrips } from '../../src/lib/api';

export default function AdminTrips() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('open');
  useEffect(() => watchAllTrips(setTrips), []);
  const shown = useMemo(() => trips.filter((tr) => status === 'all' || tr.status === status), [trips, status]);

  return (
    <Screen>
      <Title>{t('admin.allTrips')}</Title>
      <ChipGroup
        value={status}
        onChange={setStatus}
        options={[
          { value: 'open', label: t('trip.open') },
          { value: 'completed', label: t('trip.completed') },
          { value: 'cancelled', label: t('trip.statusCancelled') },
          { value: 'all', label: t('route.all') },
        ]}
      />
      {shown.length === 0 ? <Empty text={t('trip.noTrips')} /> : null}
      {shown.map((tr) => (
        <TripCard key={tr.id} trip={tr} uid={null} onPress={() => router.push(`/admin/trip/${tr.id}`)} />
      ))}
    </Screen>
  );
}
