import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatPlanPriceCents } from '../constants/planCadence';
import { SubscriptionsSetupProgress } from './SubscriptionsSetupProgress';

/**
 * Short celebration after the first plan is saved.
 * @param {object} props
 * @param {{ name: string; priceCents: number }} props.plan
 * @param {() => void} props.onContinue
 */
export function SubscriptionsSetupCompleteCard({ plan, onContinue }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignItems: 'center',
          gap: 16,
          paddingVertical: 22,
        },
        checkWrap: {
          alignItems: 'center',
          backgroundColor: 'rgba(34, 197, 94, 0.16)',
          borderColor: 'rgba(34, 197, 94, 0.45)',
          borderRadius: 999,
          borderWidth: 1.5,
          height: 72,
          justifyContent: 'center',
          width: 72,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 24,
          letterSpacing: -0.5,
          lineHeight: 30,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          textAlign: 'center',
        },
        planChip: {
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          marginTop: 2,
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        planName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        planPrice: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          letterSpacing: -0.35,
          marginTop: 6,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View>
      <SubscriptionsSetupProgress activeKey="share" completedKeys={['turn_on', 'plan']} />
      <SurfaceCard outlined padding="md" style={styles.card}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <View style={styles.checkWrap}>
            <Ionicons color="#22c55e" name="checkmark-circle" size={44} />
          </View>
        </Animated.View>
        <AppText style={styles.title}>You’re live</AppText>
        <AppText style={styles.body}>
          Your first plan is ready. Share your link so customers can subscribe.
        </AppText>
        <View style={styles.planChip}>
          <AppText style={styles.planName}>{plan.name}</AppText>
          <AppText style={styles.planPrice}>{formatPlanPriceCents(plan.priceCents)}</AppText>
        </View>
        <Button
          fullWidth
          labelColor="#0b0c0f"
          title="Continue"
          variant="surfaceLight"
          onPress={onContinue}
        />
      </SurfaceCard>
    </View>
  );
}
