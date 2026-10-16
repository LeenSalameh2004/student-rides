import { useState } from 'react';
import { Alert } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, LangToggle, Muted, Screen, Title } from '../src/components/ui';
import { register } from '../src/lib/api';
import { errorMessage } from '../src/i18n';
import { useAuth } from '../src/context/AuthContext';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (user) return <Redirect href="/" />;

  const submit = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) return Alert.alert(t('auth.fillAll'));
    setBusy(true);
    try {
      await register({ ...form, lang: i18n.language });
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <LangToggle />
      <Title>{t('auth.register')}</Title>
      <Field label={t('auth.name')} value={form.name} onChangeText={set('name')} autoComplete="name" />
      <Field label={t('auth.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="07XXXXXXXX" autoComplete="tel" />
      <Field label={t('auth.email')} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label={t('auth.password')} value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" />
      <Button title={t('auth.register')} onPress={submit} loading={busy} />
      <Link href="/login" asChild>
        <Button title={t('auth.haveAccount')} variant="ghost" />
      </Link>
      <Card style={{ marginTop: 16 }}>
        <Muted>{t('auth.captainNote')}</Muted>
      </Card>
    </Screen>
  );
}
