import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { paymentTextStyles } from '../constants/paymentTypography';

const ACCENT = '#10b981';

/**
 * Selectable row for payment checkout preference (radio semantics).
 * Each option uses the same outlined `SurfaceCard` as the rest of the app.
 */
export function PaymentMethodRadioTile({ title, description, selected, onSelect }) {
  const { colors, isDark } = useTheme();

  const selectedCardStyle = selected
    ? {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
        borderColor: ACCENT,
      }
    : null;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.pressable, pressed && !selected && styles.pressed]}
      onPress={onSelect}
    >
      <SurfaceCard outlined padding="md" style={selectedCardStyle}>
        <View style={styles.row}>
          <View style={styles.leading}>
            {selected ? (
              <View style={[styles.radioSelected, { backgroundColor: ACCENT }]}>
                <Ionicons color="#ffffff" name="checkmark" size={14} />
              </View>
            ) : (
              <View style={[styles.radioOuter, { borderColor: colors.textMuted }]} />
            )}
          </View>
          <View style={styles.textBlock}>
            <AppText style={[paymentTextStyles.optionTitle, { color: colors.text }]}>
              {title}
            </AppText>
            <AppText style={[paymentTextStyles.caption, { color: colors.textMuted }]}>
              {description}
            </AppText>
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    width: '100%',
  },
  leading: {
    alignItems: 'flex-start',
    marginRight: 12,
    width: 24,
  },
  radioOuter: {
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  radioSelected: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
