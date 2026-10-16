import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius } from '../theme';
import { seatNumbers, seatStatus } from '../lib/seats.js';

// Top-down view of the car. Jordan drives on the right, so the driver sits front-left.
// The car itself is always drawn left-to-right, even in Arabic, so seats match reality.
export default function SeatMap({ trip, uid, selected, onSelect, showNames = false }) {
  const { t } = useTranslation();
  const nums = seatNumbers(trip);
  const front = nums.slice(0, 1);
  const rest = nums.slice(1);
  const backRows = [];
  for (let i = 0; i < rest.length; i += 3) backRows.push(rest.slice(i, i + 3));

  const seat = (n) => {
    const status = seatStatus(trip, n, uid);
    const isSel = selected === n;
    const bg =
      isSel ? colors.seatSelected : status === 'free' ? colors.seatFree : status === 'mine' ? colors.seatMine : colors.seatTaken;
    const label = isSel ? t('seats.selected') : status === 'free' ? t('seats.available') : status === 'mine' ? t('seats.yours') : t('seats.booked');
    const tappable = status === 'free' && onSelect;
    const name = showNames ? trip.seats?.[n]?.name : null;
    return (
      <Pressable
        key={n}
        disabled={!tappable}
        onPress={() => onSelect && onSelect(isSel ? null : n)}
        accessibilityRole="button"
        accessibilityLabel={`${t('seats.seatN', { n })}: ${label}`}
        style={({ pressed }) => [styles.seat, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }, isSel && styles.selected]}
      >
        <Text style={styles.seatNum}>{n}</Text>
        <Text style={styles.seatLabel} numberOfLines={1}>{name || label}</Text>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.car}>
        <View style={styles.windshield} />
        <View style={styles.row}>
          <View style={[styles.seat, styles.driver]}>
            <Text style={styles.wheel}>◎</Text>
            <Text style={[styles.seatLabel, { color: colors.muted }]}>{t('seats.driver')}</Text>
          </View>
          {front.map(seat)}
        </View>
        {backRows.map((r, i) => (
          <View key={i} style={styles.row}>{r.map(seat)}</View>
        ))}
      </View>
      <Legend />
    </View>
  );
}

export function Legend() {
  const { t } = useTranslation();
  const item = (c, l) => (
    <View style={styles.legendItem} key={l}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <Text style={styles.legendText}>{l}</Text>
    </View>
  );
  return (
    <View style={styles.legend}>
      {item(colors.seatFree, t('seats.available'))}
      {item(colors.seatTaken, t('seats.booked'))}
      {item(colors.seatMine, t('seats.yours'))}
      {item(colors.seatSelected, t('seats.selected'))}
    </View>
  );
}

// Small strip of coloured dots for list cards: green = free, red = taken.
export function SeatDots({ trip, uid }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, direction: 'ltr' }}>
      {seatNumbers(trip).map((n) => {
        const s = seatStatus(trip, n, uid);
        const c = s === 'free' ? colors.seatFree : s === 'mine' ? colors.seatMine : colors.seatTaken;
        return <View key={n} style={[styles.miniDot, { backgroundColor: c }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  car: {
    direction: 'ltr',
    alignSelf: 'center',
    backgroundColor: '#EEF1F4',
    borderRadius: 48,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#CBD2D9',
    width: 300,
    maxWidth: '100%',
  },
  windshield: { height: 14, marginHorizontal: 30, marginBottom: 12, borderRadius: 8, backgroundColor: '#BFD7E6' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  seat: {
    flex: 1, height: 74, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  driver: { backgroundColor: '#D9DEE3', flex: 1 },
  selected: { borderWidth: 3, borderColor: colors.text },
  wheel: { fontSize: 24, color: colors.muted },
  seatNum: { color: colors.white, fontSize: 22, fontWeight: '800' },
  seatLabel: { color: colors.white, fontSize: 11, fontWeight: '700', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 13, color: colors.text },
  miniDot: { width: 14, height: 14, borderRadius: 4 },
});
