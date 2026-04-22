import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/** OAuth-style row (Google / Apple). Wire `onPress` from auth (e.g. Supabase). */
export function SocialSignInButton({
  provider,
  onPress,
  fullWidth = true,
  /** Shorter label + tighter padding for side-by-side rows */
  compact = false,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const isGoogle = provider === 'google';
  const label = compact
    ? isGoogle
      ? 'Google'
      : 'Apple'
    : isGoogle
      ? 'Continue with Google'
      : 'Continue with Apple';
  const a11yLabel = isGoogle ? 'Continue with Google' : 'Continue with Apple';
  const icon = isGoogle ? 'logo-google' : 'logo-apple';

  return (
    <Pressable
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress ?? (() => {})}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        !fullWidth && styles.flexInRow,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <View
        style={[
          styles.face,
          compact && styles.faceCompact,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            maxWidth: '100%',
            width: '100%',
          },
        ]}
      >
        <Ionicons color={colors.text} name={icon} size={isGoogle ? 22 : 24} />
        <AppText
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            styles.label,
            compact && styles.labelCompact,
            compact && styles.labelShrink,
            { color: colors.text },
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  flexInRow: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  face: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  faceCompact: {
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  labelCompact: {
    fontSize: 14,
    marginLeft: 6,
  },
  labelShrink: {
    flexShrink: 1,
  },
});
