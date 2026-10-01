import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * @param {object} props
 * @param {string} props.iconName
 * @param {string} props.label
 * @param {() => void} props.onPress
 */
function InvoiceActionItem({ iconName, label, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressed: {
          opacity: 0.72,
        },
        card: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          gap: 6,
          justifyContent: 'center',
          minHeight: 72,
          paddingHorizontal: 8,
          paddingVertical: 12,
          width: '100%',
        },
        label: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.1,
          lineHeight: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.card, pressed && styles.pressed]}>
          <Ionicons color={colors.text} name={iconName} size={18} />
          <AppText style={styles.label}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Equal-width actions under the invoice. Sent invoices also offer mark as paid and void.
 *
 * @param {object} props
 * @param {boolean} props.isSent
 */
export function InvoiceActions({ isSent }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          gap: 10,
          marginTop: 16,
          width: '100%',
        },
        row: {
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        cell: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [],
  );

  const sentActions = [
    { iconName: 'checkmark-circle-outline', label: 'Mark as paid' },
    { iconName: 'close-circle-outline', label: 'Void' },
  ];
  const shareActions = [
    { iconName: 'download-outline', label: 'Download PDF' },
    { iconName: 'link-outline', label: 'Copy link' },
  ];

  const renderRow = (actions) => (
    <View style={styles.row}>
      {actions.map((action) => (
        <View key={action.label} style={styles.cell}>
          <InvoiceActionItem iconName={action.iconName} label={action.label} onPress={() => {}} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.grid}>
      {isSent ? renderRow(sentActions) : null}
      {renderRow(shareActions)}
    </View>
  );
}
