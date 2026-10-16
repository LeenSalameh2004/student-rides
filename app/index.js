import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/context/AuthContext';
import { Button, Loading, Muted, Screen, Title } from '../src/components/ui';
import { logout } from '../src/lib/api';

// Sends each person to their own area based on their role.
export default function Index() {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!profile) {
    return (
      <Screen>
        <Title>{t('common.error')}</Title>
        <Muted>{t('errors.unknown')}</Muted>
        <Button title={t('common.logout')} onPress={logout} />
      </Screen>
    );
  }
  if (profile.role === 'admin') return <Redirect href="/admin" />;
  if (profile.role === 'captain') return <Redirect href="/captain" />;
  return <Redirect href="/student" />;
}
