import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** Small pill badge flagging a recently launched feature. */
export function NewLabel() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonSecondaryBg,
          borderColor: colors.cardBorder,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          justifyContent: 'center',
          marginLeft: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        text: {
          color: colors.textSuccess,
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
    [colors],
  );

  return (
    <View style={styles.root}>
      <AppText style={styles.text}>New</AppText>
    </View>
  );
}
