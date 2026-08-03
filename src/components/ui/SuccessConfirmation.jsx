import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { fireSuccessHaptic } from '../../utils/feedbackHaptics';
import { AnimatedCheckmark } from './AnimatedCheckmark';
import { AppText } from './AppText';

/**
 * Shared success confirmation — open green ring check + tight title/body rise-in.
 * Reuse for post-action moments (SMS sent, saved, etc.).
 *
 * @param {{
 *   title: string;
 *   body?: string | import('react').ReactNode;
 *   checkSize?: number;
 *   iconAccessibilityLabel?: string;
 *   playHaptic?: boolean;
 *   replayKey?: string | number;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 * }} props
 */
export function SuccessConfirmation({
  title,
  body,
  checkSize = 72,
  iconAccessibilityLabel = 'Success',
  playHaptic = false,
  replayKey = 0,
  style,
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(14);

    if (playHaptic) {
      fireSuccessHaptic();
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, playHaptic, replayKey, translateY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        },
        icon: {
          marginBottom: 16,
        },
        copy: {
          alignItems: 'center',
          gap: 4,
          maxWidth: 280,
        },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.35,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <Animated.View style={[styles.root, style, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.icon}>
        <AnimatedCheckmark
          accessibilityLabel={iconAccessibilityLabel}
          replayKey={replayKey}
          size={checkSize}
        />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        {body != null ? (
          typeof body === 'string' ? (
            <AppText style={styles.body}>{body}</AppText>
          ) : (
            body
          )
        ) : null}
      </View>
    </Animated.View>
  );
}
