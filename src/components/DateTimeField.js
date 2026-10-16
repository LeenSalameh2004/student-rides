import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { styles } from './ui';
import { colors } from '../theme';
import { formatDateTime } from '../i18n';

// Picks a date and a time. Android shows two dialogs (date then time); iOS shows one picker.
export default function DateTimeField({ label, value, onChange, minimumDate = new Date() }) {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState(null); // 'date' | 'time' | 'datetime' | null

  const open = () => setMode(Platform.OS === 'ios' ? 'datetime' : 'date');

  const handle = (event, picked) => {
    if (event?.type === 'dismissed' || !picked) {
      setMode(null);
      return;
    }
    if (mode === 'date') {
      const next = new Date(value);
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      onChange(next);
      setMode('time');
      return;
    }
    if (mode === 'time') {
      const next = new Date(value);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      onChange(next);
      setMode(null);
      return;
    }
    onChange(picked); // iOS datetime
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={open} style={[styles.input, { justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.text, textAlign: 'left' }}>
          📅 {formatDateTime(value.getTime(), i18n.language)}
        </Text>
      </Pressable>
      {mode ? (
        <DateTimePicker
          value={value}
          mode={mode}
          minimumDate={mode === 'time' ? undefined : minimumDate}
          minuteInterval={5}
          is24Hour={false}
          locale={i18n.language === 'ar' ? 'ar-JO' : 'en-GB'}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : null}
      {Platform.OS === 'ios' && mode ? (
        <Pressable onPress={() => setMode(null)} style={{ alignSelf: 'flex-end', padding: 8 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
