import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Small pill badge for features still in beta. */
export function BetaLabel() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonSecondaryBg,
          borderColor: colors.cardBorder,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          marginLeft: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        text: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <AppText style={styles.text}>Beta</AppText>
    </View>
  );
}
