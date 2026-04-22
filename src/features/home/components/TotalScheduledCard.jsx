import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';

export function TotalScheduledCard({ count, isLoading, businessError, bookingsError }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scheduleError = businessError || bookingsError || null;
  const blocked = Boolean(scheduleError) || isLoading;

  const label = useMemo(
    () => (count === 1 ? 'Scheduled appointment' : 'Scheduled appointments'),
    [count],
  );

  const a11yLabel = useMemo(() => {
    if (scheduleError) {
      return `Error loading appointments. ${scheduleError}`;
    }
    if (isLoading) {
      return 'Loading scheduled appointments';
    }
    return `${count.toLocaleString()} ${label}. Opens bookings.`;
  }, [count, isLoading, label, scheduleError]);

  return (
    <Pressable
      accessibilityHint={blocked ? undefined : 'Opens your bookings list'}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={() => navigation.navigate(ROUTES.BOOKINGS)}
      style={({ pressed }) => [styles.pressable, pressed && !blocked && styles.pressed]}
    >
      <SurfaceCard style={styles.card}>
        {isLoading ? (
          <View style={styles.row}>
            <View style={styles.main}>
              <SkeletonBox borderRadius={10} height={40} width={72} />
              <SkeletonBox borderRadius={8} height={15} style={{ marginTop: 10 }} width={200} />
            </View>
            <SkeletonBox borderRadius={8} height={22} width={22} />
          </View>
        ) : scheduleError ? (
          <InlineCardError message={scheduleError} />
        ) : (
          <View style={styles.row}>
            <View style={styles.main}>
              <AppText style={[styles.value, { color: colors.text }]}>
                {count.toLocaleString()}
              </AppText>
              <AppText style={[styles.label, { color: colors.textMuted }]}>{label}</AppText>
            </View>
            <Ionicons
              accessibilityElementsHidden
              color={colors.textMuted}
              importantForAccessibility="no"
              name="chevron-forward"
              size={22}
            />
          </View>
        )}
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 20,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    marginTop: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
});
