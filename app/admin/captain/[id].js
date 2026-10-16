import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Chip, ChipGroup, Field, Loading, Muted, Screen, Subtitle, SwitchRow, Title } from '../../../src/components/ui';
import TripForm from '../../../src/components/TripForm';
import { deleteCaptain, getCaptain, saveCaptain } from '../../../src/lib/api';
import { useAuth } from '../../../src/context/AuthContext';
import { AREAS } from '../../../src/constants/routes';
import { DEFAULT_SEAT_COUNT } from '../../../src/constants/config';
import { colors } from '../../../src/theme';
import { errorMessage } from '../../../src/i18n';

const EMPTY = {
  name: '', phone: '', email: '', licenseNo: '', photoUrl: '', active: true,
  seatCount: DEFAULT_SEAT_COUNT, areaIds: AREAS.map((a) => a.id),
  car: { make: '', model: '', year: '', color: '', plate: '' },
};

// Admin: manual entry of driver and car details.
export default function CaptainEditor() {
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      return;
    }
    getCaptain(String(id)).then((c) => setForm(c ? { ...EMPTY, ...c, car: { ...EMPTY.car, ...(c.car || {}) } } : EMPTY));
  }, [id, isNew]);

  if (!form) return <Loading />;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setCar = (k) => (v) => setForm((f) => ({ ...f, car: { ...f.car, [k]: v } }));
  const toggleArea = (a) =>
    setForm((f) => ({ ...f, areaIds: f.areaIds.includes(a) ? f.areaIds.filter((x) => x !== a) : [...f.areaIds, a] }));

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.car.plate.trim()) return Alert.alert(t('auth.fillAll'));
    setBusy(true);
    try {
      const savedId = await saveCaptain(isNew ? null : String(id), form);
      Alert.alert(t('common.saved'));
      if (isNew) router.replace(`/admin/captain/${savedId}`);
    } catch (e) {
      Alert.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert(t('common.delete'), t('common.areYouSure'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCaptain(String(id));
            router.back();
          } catch (e) {
            Alert.alert(errorMessage(e));
          }
        },
      },
    ]);

  return (
    <Screen>
      <Button title={`‹ ${t('common.back')}`} variant="ghost" small onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <Title>{isNew ? t('admin.addCaptain') : t('admin.editCaptain')}</Title>
      {!isNew ? <Badge label={form.uid ? t('admin.linked') : t('admin.notLinked')} color={form.uid ? colors.primary : colors.accent} /> : null}

      <Card style={{ marginTop: 12 }}>
        <Subtitle>👤 {t('admin.driver')}</Subtitle>
        <Field label={t('auth.name')} value={form.name} onChangeText={set('name')} />
        <Field label={t('auth.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="07XXXXXXXX" />
        <Field label={t('auth.email')} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
        <Muted style={{ marginTop: -6, marginBottom: 10, fontSize: 12 }}>{t('admin.emailHint')}</Muted>
        <Field label={t('admin.licenseNo')} value={form.licenseNo} onChangeText={set('licenseNo')} />
        <Field label={t('admin.photoUrl')} value={form.photoUrl} onChangeText={set('photoUrl')} autoCapitalize="none" />
        <SwitchRow label={t('admin.active')} value={form.active} onValueChange={set('active')} />
      </Card>

      <Card>
        <Subtitle>🚗 {t('admin.carDetails')}</Subtitle>
        <Field label={t('admin.make')} value={form.car.make} onChangeText={setCar('make')} placeholder="Toyota" />
        <Field label={t('admin.model')} value={form.car.model} onChangeText={setCar('model')} placeholder="Corolla" />
        <Field label={t('admin.year')} value={String(form.car.year || '')} onChangeText={setCar('year')} keyboardType="number-pad" />
        <Field label={t('admin.color')} value={form.car.color} onChangeText={setCar('color')} />
        <Field label={t('admin.plate')} value={form.car.plate} onChangeText={setCar('plate')} placeholder="12-34567" />
        <Muted style={{ marginBottom: 6 }}>{t('admin.seatCount')}</Muted>
        <ChipGroup
          value={Number(form.seatCount)}
          onChange={set('seatCount')}
          options={[2, 3, 4, 6].map((n) => ({ value: n, label: String(n) }))}
        />
        <Muted style={{ marginBottom: 6 }}>{t('admin.areas')}</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AREAS.map((a) => (
            <Chip key={a.id} label={a.name[lang]} selected={form.areaIds.includes(a.id)} onPress={() => toggleArea(a.id)} />
          ))}
        </View>
      </Card>

      <Button title={t('common.save')} onPress={save} loading={busy} />
      {!isNew ? <Button title={t('common.delete')} variant="danger" onPress={remove} /> : null}

      {!isNew && form.id ? (
        <View style={{ marginTop: 16 }}>
          <TripForm captain={{ ...form, id: String(id) }} createdBy={user.uid} onCreated={(tid) => router.push(`/admin/trip/${tid}`)} />
        </View>
      ) : null}
    </Screen>
  );
}
