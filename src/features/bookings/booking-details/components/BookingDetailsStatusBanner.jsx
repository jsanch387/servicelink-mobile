import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/** Same green as booking details “Complete” action tile. */
const COMPLETE_ICON = '#22c55e';

/** Muted accent strokes: visible on `cardSurface`, softer than solid icon hex on dark. */
const BORDER = {
  complete: { dark: 'rgba(34, 197, 94, 0.45)', light: 'rgba(22, 163, 74, 0.38)' },
  canceled: { dark: 'rgba(248, 113, 113, 0.42)', light: 'rgba(220, 38, 38, 0.34)' },
};

export function BookingDetailsStatusBanner({ isCanceled, isCompleted }) {
  const { colors, isDark } = useTheme();
  const variant = isCanceled ? 'canceled' : isCompleted ? 'completed' : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inner: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        title: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.25,
          minWidth: 0,
        },
      }),
    [colors],
  );

  if (!variant) {
    return null;
  }

  const isCanceledVariant = variant === 'canceled';
  const title = isCanceledVariant ? 'Canceled' : 'Completed';
  const iconColor = isCanceledVariant ? colors.danger : COMPLETE_ICON;
  const scheme = isDark ? 'dark' : 'light';
  const borderColor = isCanceledVariant ? BORDER.canceled[scheme] : BORDER.complete[scheme];

  return (
    <SurfaceCard
      accessibilityLabel={title}
      accessible
      outlined
      padding="none"
      style={{ borderColor, borderWidth: 1 }}
    >
      <View style={styles.inner}>
        <Ionicons
          accessibilityElementsHidden
          color={iconColor}
          name={isCanceledVariant ? 'close-circle' : 'checkmark-done-circle'}
          size={24}
        />
        <AppText style={styles.title}>{title}</AppText>
      </View>
    </SurfaceCard>
  );
}
