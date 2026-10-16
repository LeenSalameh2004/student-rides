import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Field, LangToggle, Muted, Screen, Title } from '../src/components/ui';
import { login, resetPassword } from '../src/lib/api';
import { errorMessage } from '../src/i18n';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';

export default function Login() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href="/" />;

  const submit = async () => {
    if (!email || !password) return Alert.alert(t('auth.fillAll'));
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email) return Alert.alert(t('auth.email'));
    try {
      await resetPassword(email);
      Alert.alert(t('auth.resetSent'));
    } catch (e) {
      Alert.alert(errorMessage(e));
    }
  };

  return (
    <Screen>
      <LangToggle />
      <View style={{ alignItems: 'center', marginVertical: 28 }}>
        <Text style={{ fontSize: 56 }}>🚗🎓</Text>
        <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary, marginTop: 8 }}>{t('appName')}</Text>
        <Muted style={{ textAlign: 'center', marginTop: 6 }}>{t('tagline')}</Muted>
      </View>
      <Title>{t('auth.welcome')}</Title>
      <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Button title={t('auth.login')} onPress={submit} loading={busy} />
      <Button title={t('auth.forgot')} variant="ghost" onPress={forgot} />
      <Link href="/register" asChild>
        <Button title={t('auth.noAccount')} variant="secondary" />
      </Link>
    </Screen>
  );
}
