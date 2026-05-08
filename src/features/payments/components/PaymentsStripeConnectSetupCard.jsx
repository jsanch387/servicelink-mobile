import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const BULLETS = [
  'Collect deposits',
  'Accept payments through your booking link',
  'Get paid out to your bank',
];

const RESTRICTED_TITLE = 'Stripe needs attention';

function BulletRow({ children }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <View style={styles.checkGlyph}>
        <Svg height={10} viewBox="0 0 24 24" width={12}>
          <Path
            d="M20 6L9 17l-5-5"
            fill="none"
            stroke="#22c55e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
          />
        </Svg>
      </View>
      <AppText style={[styles.bulletText, { color: colors.text }]}>{children}</AppText>
    </View>
  );
}

/**
 * Pro-only: Stripe Connect onboarding entry (matches marketing “Set up payments” layout).
 */
export function PaymentsStripeConnectSetupCard({
  title,
  description,
  buttonTitle,
  loading,
  onConnectPress,
}) {
  const { colors } = useTheme();
  const showBullets = title !== RESTRICTED_TITLE;

  return (
    <SurfaceCard outlined padding="md" style={styles.card}>
      <View style={styles.headBlock}>
        <AppText style={[styles.cardTitle, { color: colors.text }]}>{title}</AppText>
        <AppText style={[styles.cardBody, { color: colors.textMuted }]}>{description}</AppText>
      </View>
      <Button
        fullWidth
        labelColor="#0b0c0f"
        loading={loading}
        title={buttonTitle}
        variant="surfaceLight"
        onPress={onConnectPress}
      />
      {showBullets ? (
        <View style={styles.benefitsBlock}>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <View style={styles.bulletList}>
            {BULLETS.map((line) => (
              <BulletRow key={line}>{line}</BulletRow>
            ))}
          </View>
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  /** Title + subtitle read as one unit; tighter coupling than gap to the CTA below. */
  headBlock: {
    gap: 7,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.45,
    lineHeight: 27,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  benefitsBlock: {
    gap: 12,
  },
  rule: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  checkGlyph: {
    alignItems: 'center',
    borderColor: 'rgba(34,197,94,0.5)',
    borderRadius: 999,
    borderWidth: 1.25,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 18,
    opacity: 0.88,
  },
});
