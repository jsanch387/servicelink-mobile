import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_SETUP_BODY,
  SUBSCRIPTIONS_SETUP_BULLETS,
  SUBSCRIPTIONS_SETUP_CTA,
  SUBSCRIPTIONS_SETUP_TITLE,
} from '../constants/setupCopy';

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
 * First-open hero — turn subscriptions on (mirrors Payments Connect setup card).
 * @param {object} props
 * @param {() => void} props.onTurnOn
 * @param {boolean} [props.loading]
 * @param {string} [props.title]
 * @param {string} [props.body]
 * @param {string} [props.cta]
 * @param {string[]} [props.bullets]
 */
export function SubscriptionsSetupCard({
  onTurnOn,
  loading = false,
  title = SUBSCRIPTIONS_SETUP_TITLE,
  body = SUBSCRIPTIONS_SETUP_BODY,
  cta = SUBSCRIPTIONS_SETUP_CTA,
  bullets = SUBSCRIPTIONS_SETUP_BULLETS,
}) {
  const { colors } = useTheme();

  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        cardBody: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 19,
        },
        cardTitle: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.45,
          lineHeight: 27,
        },
        rule: {
          alignSelf: 'stretch',
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="md" style={styles.card}>
      <View style={styles.headBlock}>
        <AppText style={localStyles.cardTitle}>{title}</AppText>
        <AppText style={localStyles.cardBody}>{body}</AppText>
      </View>
      <Button
        disabled={loading}
        fullWidth
        labelColor="#0b0c0f"
        title={loading ? 'Turning on…' : cta}
        variant="surfaceLight"
        onPress={onTurnOn}
      />
      <View style={styles.benefitsBlock}>
        <View style={localStyles.rule} />
        <View style={styles.bulletList}>
          {bullets.map((line) => (
            <BulletRow key={line}>{line}</BulletRow>
          ))}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  headBlock: {
    gap: 7,
  },
  benefitsBlock: {
    gap: 12,
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
