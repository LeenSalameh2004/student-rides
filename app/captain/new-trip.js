import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Loading, Muted, Screen, Title } from '../../src/components/ui';
import TripForm from '../../src/components/TripForm';
import { useMyCaptain } from '../../src/lib/hooks';
import { useAuth } from '../../src/context/AuthContext';

export default function NewTrip() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const captain = useMyCaptain();
  const params = useLocalSearchParams();
  const preset = params.requestId
    ? { requestId: String(params.requestId), areaId: String(params.areaId), direction: String(params.direction), desiredAt: Number(params.desiredAt) }
    : null;

  if (captain === undefined) return <Loading />;
  if (!captain) return <Screen><Card><Muted>{t('captain.notLinked')}</Muted></Card></Screen>;

  return (
    <Screen>
      <Title>{t('tabs.newTrip')}</Title>
      <TripForm
        key={preset?.requestId || 'blank'}
        captain={captain}
        createdBy={user.uid}
        preset={preset}
        onCreated={(id) => router.replace(`/captain/trip/${id}`)}
      />
    </Screen>
  );
}
