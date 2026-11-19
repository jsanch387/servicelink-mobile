import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { ASSISTANT_ACTIONS } from '../constants/assistantCopy';

const CARD_PADDING = 20;
const CAPSULE_HEIGHT = 36;

/**
 * One suggestion: a short observation, then the action the assistant has ready.
 * The first card carries the filled capsule. The next stays quiet.
 */
function AssistantActionCard({ headline, detail, action, primary = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 16,
          padding: CARD_PADDING,
        },
        headline: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '600',
          letterSpacing: -0.6,
        },
        detail: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '400',
          letterSpacing: -0.2,
          lineHeight: 22,
          marginTop: 4,
        },
        capsule: {
          alignSelf: 'flex-start',
          marginTop: 20,
        },
        face: {
          alignItems: 'center',
          backgroundColor: primary ? colors.buttonPrimaryBg : 'transparent',
          borderColor: primary ? 'transparent' : colors.borderStrong,
          borderRadius: CAPSULE_HEIGHT / 2,
          borderWidth: primary ? 0 : 1,
          height: CAPSULE_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: 16,
        },
        facePressed: {
          backgroundColor: primary ? colors.buttonPrimaryBgPressed : colors.buttonGhostPressed,
        },
        label: {
          color: primary ? colors.buttonPrimaryText : colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }),
    [colors, primary],
  );

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <AppText style={styles.headline}>{headline}</AppText>
      <AppText style={styles.detail}>{detail}</AppText>
      <Pressable accessibilityRole="button" onPress={() => {}} style={styles.capsule}>
        {({ pressed }) => (
          <View style={[styles.face, pressed && styles.facePressed]}>
            <AppText style={styles.label}>{action}</AppText>
          </View>
        )}
      </Pressable>
    </SurfaceCard>
  );
}

export function AssistantActionList() {
  return (
    <View style={styles.list}>
      {ASSISTANT_ACTIONS.map((item, index) => (
        <AssistantActionCard
          key={item.id}
          action={item.action}
          detail={item.detail}
          headline={item.headline}
          primary={index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
