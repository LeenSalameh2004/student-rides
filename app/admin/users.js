import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Card, Chip, ChipGroup, Field, Muted, Row, Screen, Title } from '../../src/components/ui';
import { setUserRole, watchUsers } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme';
import { errorMessage } from '../../src/i18n';

const ROLE_COLOR = { student: colors.primary, captain: colors.seatFree, admin: colors.accent };

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => watchUsers(setUsers), []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) => (role === 'all' || u.role === role) &&
        (!q || [u.name, u.email, u.phone].some((v) => (v || '').toLowerCase().includes(q)))
    );
  }, [users, role, search]);

  // Captains are linked from the Captains tab (by email), so only student/admin are switched here.
  const change = (u, next) =>
    Alert.alert(t('admin.changeRole'), `${u.name}: ${t(`roles.${next}`)}?`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), onPress: () => setUserRole(u.id, next).catch((e) => Alert.alert(errorMessage(e))) },
    ]);

  return (
    <Screen>
      <Title>{t('tabs.users')}</Title>
      <Field value={search} onChangeText={setSearch} placeholder="🔍" autoCapitalize="none" />
      <ChipGroup
        value={role}
        onChange={setRole}
        options={['all', 'student', 'captain', 'admin'].map((r) => ({ value: r, label: r === 'all' ? t('route.all') : t(`roles.${r}`) }))}
      />
      {shown.map((u) => (
        <Card key={u.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: colors.text, flex: 1, textAlign: 'left' }}>{u.name}</Text>
            <Badge label={t(`roles.${u.role}`)} color={ROLE_COLOR[u.role] || colors.muted} />
          </Row>
          <Muted>{u.email} • {u.phone}</Muted>
          {u.home?.address ? <Muted>🏠 {u.home.address}</Muted> : null}
          {u.id !== user.uid && u.role !== 'captain' ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {['student', 'admin'].filter((r) => r !== u.role).map((r) => (
                <Chip key={r} label={`${t('admin.changeRole')}: ${t(`roles.${r}`)}`} onPress={() => change(u, r)} />
              ))}
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
