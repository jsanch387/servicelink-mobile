import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, lightTheme, useTheme } from '../../../theme';
import { getInvoiceStatusPillTheme } from '../utils/invoiceStatusPillTheme';

/**
 * @param {object} props
 * @param {string} props.status
 * @param {string} props.label
 * @param {boolean} [props.onLight] Pill colors for the white invoice sheet.
 * @param {boolean} [props.compact] Smaller pill for the invoice page.
 */
export function InvoiceStatusPill({ status, label, onLight = false, compact = false }) {
  const { colors, isDark } = useTheme();
  const pillTheme = useMemo(() => {
    return getInvoiceStatusPillTheme(
      status,
      onLight ? lightTheme : colors,
      onLight ? false : isDark,
    );
  }, [colors, isDark, onLight, status]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          borderRadius: 999,
          paddingHorizontal: compact ? 6 : 8,
          paddingVertical: compact ? 1 : 3,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: compact ? 10 : 12,
          letterSpacing: -0.05,
          lineHeight: compact ? 13 : 15,
        },
      }),
    [compact],
  );

  return (
    <View style={[styles.pill, { backgroundColor: pillTheme.backgroundColor }]}>
      <AppText style={[styles.pillText, { color: pillTheme.color }]}>{label}</AppText>
    </View>
  );
}
