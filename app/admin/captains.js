import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Empty, Muted, Row, Screen, Title } from '../../src/components/ui';
import { watchCaptains } from '../../src/lib/api';
import { areaById } from '../../src/constants/routes';
import { colors } from '../../src/theme';

export default function AdminCaptains() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [captains, setCaptains] = useState([]);
  useEffect(() => watchCaptains(setCaptains), []);

  return (
    <Screen>
      <Title>{t('tabs.captains')}</Title>
      <Button title={`➕ ${t('admin.addCaptain')}`} onPress={() => router.push('/admin/captain/new')} />
      {captains.length === 0 ? <Empty text={t('common.none')} /> : null}
      {captains.map((c) => (
        <Card key={c.id} onPress={() => router.push(`/admin/captain/${c.id}`)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'left' }}>👤 {c.name}</Text>
            <Badge label={c.active ? t('admin.active') : t('admin.inactive')} color={c.active ? colors.seatFree : colors.muted} />
          </Row>
          <Muted>📞 {c.phone} • ✉️ {c.email || '—'}</Muted>
          <Muted>🚗 {[c.car?.make, c.car?.model, c.car?.year, c.car?.color].filter(Boolean).join(' ')} • {c.car?.plate}</Muted>
          <Muted>📍 {(c.areaIds || []).map((a) => areaById(a)?.name[lang]).filter(Boolean).join('، ')}</Muted>
          <Badge label={c.uid ? t('admin.linked') : t('admin.notLinked')} color={c.uid ? colors.primary : colors.accent} />
        </Card>
      ))}
    </Screen>
  );
}
