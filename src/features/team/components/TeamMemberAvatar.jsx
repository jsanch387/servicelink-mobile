import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Letter chip for a team member. Size is the circle diameter.
 */
export function TeamMemberAvatar({ initial, size = 40 }) {
  const { colors } = useTheme();
  const letterSize = Math.round(size * 0.38);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.cardBorder,
          borderRadius: size / 2,
          borderWidth: 1,
          height: size,
          justifyContent: 'center',
          width: size,
        },
        letter: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: letterSize,
          letterSpacing: -0.3,
        },
      }),
    [colors, letterSize, size],
  );

  return (
    <View style={styles.avatar}>
      <AppText style={styles.letter}>{initial}</AppText>
    </View>
  );
}
