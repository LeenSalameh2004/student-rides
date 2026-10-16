import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Empty, Loading, Screen, Title } from '../../../src/components/ui';
import BookingPanel from '../../../src/components/BookingPanel';
import { watchTrip } from '../../../src/lib/api';

export default function StudentTrip() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const [trip, setTrip] = useState(undefined);

  useEffect(() => watchTrip(String(id), setTrip), [id]);

  if (trip === undefined) return <Loading />;
  return (
    <Screen>
      <Button title={`‹ ${t('common.back')}`} variant="ghost" small onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      {trip ? (
        <>
          <Title>👤 {trip.captainName}</Title>
          <BookingPanel trip={trip} />
        </>
      ) : (
        <Empty text={t('errors.TRIP_NOT_FOUND')} />
      )}
    </Screen>
  );
}
