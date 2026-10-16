import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Field, LangToggle, Muted, Screen, Subtitle, Title } from './ui';
import LocationPicker, { nearestAreaId } from './LocationPicker';
import { useAuth } from '../context/AuthContext';
import { logout, saveHome, updateProfile } from '../lib/api';
import { areaById } from '../constants/routes';
import { errorMessage } from '../i18n';

export default function ProfileView({ showHome = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [home, setHome] = useState(profile.home || null);
  const [note, setNote] = useState(profile.home?.address || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile(user.uid, { name: name.trim(), phone: phone.trim() });
      if (showHome && home) {
        await saveHome(user.uid, {
          latitude: home.latitude,
          longitude: home.longitude,
          address: note.trim(),
          areaId: nearestAreaId(home),
        });
        Alert.alert(t('profile.homeSaved'));
      } else {
        Alert.alert(t('common.saved'));
      }
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const area = home ? areaById(nearestAreaId(home)) : null;

  return (
    <Screen>
      <LangToggle />
      <Title>{t('tabs.profile')}</Title>
      <Badge label={t(`roles.${profile.role}`)} />
      <Card style={{ marginTop: 12 }}>
        <Field label={t('auth.name')} value={name} onChangeText={setName} />
        <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Muted>{profile.email}</Muted>
      </Card>

      {showHome ? (
        <Card>
          <Subtitle>🏠 {t('profile.home')}</Subtitle>
          {!home ? <Muted style={{ marginBottom: 8 }}>{t('profile.noHome')}</Muted> : null}
          <LocationPicker value={home} onChange={setHome} />
          {area ? <Muted style={{ marginTop: 6 }}>{t('profile.nearestArea')}: {area.name[lang]}</Muted> : null}
          <Field label={t('profile.addressNote')} value={note} onChangeText={setNote} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <Button title={t('common.save')} onPress={save} loading={busy} />
      <Button title={t('common.logout')} variant="ghost" onPress={logout} />
    </Screen>
  );
}
