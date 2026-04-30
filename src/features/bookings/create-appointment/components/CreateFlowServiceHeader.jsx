import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Shared header for create-flow steps after service pick (pricing + add-ons): name, price, meta line.
 */
export function CreateFlowServiceHeader({ serviceName, displayPrice, metaLine }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        serviceName: {
          color: colors.text,
          flex: 1,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.35,
          marginRight: 12,
          paddingTop: 2,
        },
        headerPrice: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.35,
        },
        metaLine: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.regular,
          fontSize: 14,
          fontStyle: 'italic',
          fontWeight: '400',
          lineHeight: 20,
          marginBottom: 22,
        },
      }),
    [colors],
  );

  return (
    <View>
      <View style={styles.headerRow}>
        <AppText numberOfLines={2} style={styles.serviceName}>
          {serviceName}
        </AppText>
        <AppText style={styles.headerPrice}>{displayPrice}</AppText>
      </View>
      <AppText style={styles.metaLine}>{metaLine}</AppText>
    </View>
  );
}
