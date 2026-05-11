import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * Final step — one tap activates the booking link (server creates Stripe trial subscription, no redirect).
 *
 * @param {{ activationLink: string; onActivatePress?: () => void; activateSubmitting?: boolean }} props
 */
export function OnboardingTrialStep({ activationLink, onActivatePress, activateSubmitting }) {
  const { colors } = useTheme();

  const displayLink =
    activationLink && String(activationLink).trim()
      ? String(activationLink).trim()
      : 'myservicelink.app/your-link';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 16,
          borderWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 18,
        },
        linkLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        },
        linkMono: {
          color: colors.text,
          fontFamily: mono,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 22,
          marginBottom: 18,
        },
        highlightBox: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 14,
          marginBottom: 20,
          paddingHorizontal: 14,
          paddingVertical: 16,
        },
        flashBadge: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 14,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        grabCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        grabTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '800',
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        grabSub: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          marginTop: 6,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <AppText style={styles.linkLabel}>Your booking link</AppText>
      <AppText style={styles.linkMono}>{displayLink}</AppText>

      <View style={styles.highlightBox}>
        <View style={styles.flashBadge}>
          <Ionicons color={colors.buttonPrimaryText} name="flash" size={26} />
        </View>
        <View style={styles.grabCol}>
          <AppText style={styles.grabTitle}>Ready to go live?</AppText>
          <AppText style={styles.grabSub}>
            Tap below, then share your link so clients can book you.
          </AppText>
        </View>
      </View>

      <Button
        fullWidth
        iconColor="#000000"
        iconName="arrow-forward"
        iconPosition="right"
        loading={Boolean(activateSubmitting)}
        title="Activate my link"
        variant="primary"
        onPress={onActivatePress ?? (() => {})}
      />
    </SurfaceCard>
  );
}
