import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';
import { SUBMIT_OUTCOME_SUCCESS } from './submitOutcomeTokens';

const ICON_SIZE = 64;
const RING_SIZE = 104;

/**
 * Shared success “moment” — haptic + staged entrance for icon, copy, and optional note.
 * Use on confirmation screens so success feels consistent across the app.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.body]
 * @param {import('react').ReactNode} [props.note] Animated in after title/body (e.g. {@link SuccessNote}).
 * @param {import('react').ReactNode} [props.children] Extra content below note (not separately animated).
 * @param {string} [props.iconAccessibilityLabel]
 * @param {'inline' | 'card'} [props.variant]
 * @param {boolean} [props.centered] Vertically center inline layout (e.g. full-screen confirmation).
 * @param {boolean} [props.playHaptic] Defaults true; set false to replay animation only.
 * @param {string | number} [props.replayKey] Change to re-run entrance (design previews).
 */
export function SuccessMoment({
  title,
  body,
  note,
  children,
  iconAccessibilityLabel = 'Success',
  variant = 'inline',
  centered = false,
  playHaptic = true,
  replayKey = 'default',
}) {
  const { colors } = useTheme();
  const isCard = variant === 'card';

  const iconScale = useRef(new Animated.Value(0.55)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;
  const noteTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    iconScale.setValue(0.55);
    iconOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(16);
    noteOpacity.setValue(0);
    noteTranslateY.setValue(12);

    if (playHaptic) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    const contentAnim = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const noteAnim =
      note != null
        ? Animated.parallel([
            Animated.timing(noteOpacity, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(noteTranslateY, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ])
        : null;

    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 7,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      contentAnim,
      ...(noteAnim ? [noteAnim] : []),
    ]);

    entrance.start();
  }, [
    replayKey,
    playHaptic,
    note,
    iconScale,
    iconOpacity,
    contentOpacity,
    contentTranslateY,
    noteOpacity,
    noteTranslateY,
  ]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 8,
          minHeight: 320,
        },
        wrap: {
          alignItems: 'center',
          flex: 1,
          gap: 12,
          justifyContent: 'center',
          paddingBottom: 12,
          paddingHorizontal: 8,
          paddingTop: 28,
        },
        inlineWrap: {
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingTop: 24,
          width: '100%',
        },
        centeredInlineWrap: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 8,
          width: '100%',
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring,
          borderRadius: 999,
          height: RING_SIZE,
          justifyContent: 'center',
          marginBottom: 4,
          width: RING_SIZE,
        },
        inlineIconWrap: {
          marginBottom: 8,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.35,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          maxWidth: 320,
          textAlign: 'center',
        },
        noteSlot: {
          alignItems: 'center',
          alignSelf: 'stretch',
          width: '100%',
        },
        extra: {
          alignSelf: 'stretch',
          width: '100%',
        },
      }),
    [colors],
  );

  const iconNode = (
    <Animated.View
      style={[
        isCard ? styles.iconRing : styles.inlineIconWrap,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
        },
      ]}
    >
      <View accessibilityLabel={iconAccessibilityLabel} accessibilityRole="image">
        <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-circle" size={ICON_SIZE} />
      </View>
    </Animated.View>
  );

  const copyNode = (
    <Animated.View
      style={{
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 10,
        opacity: contentOpacity,
        transform: [{ translateY: contentTranslateY }],
      }}
    >
      <AppText style={styles.title}>{title}</AppText>
      {body != null ? (
        typeof body === 'string' ? (
          <AppText style={styles.body}>{body}</AppText>
        ) : (
          body
        )
      ) : null}
    </Animated.View>
  );

  const noteNode =
    note != null ? (
      <Animated.View
        style={[
          styles.noteSlot,
          {
            opacity: noteOpacity,
            transform: [{ translateY: noteTranslateY }],
          },
        ]}
      >
        {note}
      </Animated.View>
    ) : null;

  const content = (
    <>
      {iconNode}
      {copyNode}
      {noteNode}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </>
  );

  if (!isCard) {
    return <View style={centered ? styles.centeredInlineWrap : styles.inlineWrap}>{content}</View>;
  }

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>{content}</View>
    </SurfaceCard>
  );
}
