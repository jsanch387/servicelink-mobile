import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { getAppVersionLine } from '../../constants/appInfo';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Centered muted app version + build (from app.json / native binary).
 *
 * @param {{ style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export function AppVersionFootnote({ style }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 20,
        },
        text: {
          color: colors.textMuted,
          fontSize: 12,
          letterSpacing: 0.2,
          textAlign: 'center',
        },
      }),
    [colors.textMuted],
  );

  return (
    <View style={[styles.wrap, style]}>
      <AppText style={styles.text}>{getAppVersionLine()}</AppText>
    </View>
  );
}
