import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BookingCalendarCard } from '../../availability/booking';
import { formatExpenseDateFieldLabel } from '../utils/expenseDate';

/**
 * Month calendar in the same card as Create appointment → Schedule.
 * Past and future days are selectable so planned expenses can be logged too.
 *
 * @param {object} props
 * @param {string} props.valueYyyyMmDd
 * @param {(next: string) => void} props.onChange
 */
export function ExpenseDateField({ valueYyyyMmDd, onChange }) {
  const { colors } = useTheme();
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const minDate = useMemo(() => new Date(today.getFullYear() - 10, 0, 1), [today]);
  const maxDate = useMemo(() => new Date(today.getFullYear() + 10, 11, 31), [today]);
  const dateDisplay = formatExpenseDateFieldLabel(valueYyyyMmDd);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: 10,
        },
        selected: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <BookingCalendarCard
        cardStyle={stylesStatic.calendarCard}
        maxDate={maxDate}
        minDate={minDate}
        selectedDateKey={valueYyyyMmDd}
        onSelectDateKey={onChange}
      />
      {dateDisplay ? <AppText style={styles.selected}>{dateDisplay}</AppText> : null}
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  calendarCard: {
    marginBottom: 0,
  },
});
