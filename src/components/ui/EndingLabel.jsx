import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Small pill badge for features that are sunsetting. */
export function EndingLabel({ style }) {
  const { isDark } = useTheme();
  const textColor = isDark ? '#FBBF24' : '#B45309';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.14)',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.35)',
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          justifyContent: 'center',
          marginLeft: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        text: {
          color: textColor,
          fontSize: 11,
          fontWeight: '600',
          includeFontPadding: false,
          letterSpacing: 0.4,
          lineHeight: 14,
          textAlign: 'center',
          textAlignVertical: 'center',
          textTransform: 'uppercase',
        },
      }),
    [isDark, textColor],
  );

  return (
    <View style={[styles.root, style]}>
      <AppText style={styles.text}>Ending</AppText>
    </View>
  );
}
