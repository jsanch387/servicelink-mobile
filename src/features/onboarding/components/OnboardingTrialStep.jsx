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
 * Final step — go-live / activation (UI until Stripe Checkout is wired).
 *
 * @param {{ activationLink: string; onStartTrialPress?: () => void }} props
 */
export function OnboardingTrialStep({ activationLink, onStartTrialPress }) {
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
          marginBottom: 20,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        proRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
          width: '100%',
        },
        proTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 17,
          fontWeight: '700',
          marginRight: 12,
          paddingRight: 4,
        },
        freeTag: {
          alignSelf: 'flex-start',
          backgroundColor: '#10b981',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        freeTagText: {
          color: '#ffffff',
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 0.6,
        },
        featureSummary: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 21,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined={false} padding="none" style={styles.card}>
      <AppText style={styles.linkLabel}>Your booking link</AppText>
      <AppText style={styles.linkMono}>{displayLink}</AppText>

      <View style={styles.highlightBox}>
        <View style={styles.proRow}>
          <AppText style={styles.proTitle} numberOfLines={2}>
            7-Day Pro Access
          </AppText>
          <View style={styles.freeTag}>
            <AppText style={styles.freeTagText}>FREE</AppText>
          </View>
        </View>
        <AppText style={styles.featureSummary}>
          Unlimited bookings, deposit integrations, and more Pro tools—all included for your first
          week.
        </AppText>
      </View>

      <Button
        fullWidth
        iconColor="#000000"
        iconName="arrow-forward"
        iconPosition="right"
        title="Activate my link"
        variant="primary"
        onPress={onStartTrialPress ?? (() => {})}
      />
    </SurfaceCard>
  );
}
