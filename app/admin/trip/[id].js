import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Empty, Loading, Screen } from '../../../src/components/ui';
import TripManage from '../../../src/components/TripManage';
import { useTrip } from '../../../src/lib/hooks';

export default function AdminTrip() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const trip = useTrip(id);
  if (trip === undefined) return <Loading />;
  return (
    <Screen>
      <Button title={`‹ ${t('common.back')}`} variant="ghost" small onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      {trip ? <TripManage trip={trip} /> : <Empty text={t('errors.TRIP_NOT_FOUND')} />}
    </Screen>
  );
}
