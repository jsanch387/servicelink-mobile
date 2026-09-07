import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BOOKING_LINK_HOST } from '../../home/utils/bookingLink';
import { MAX_BUSINESS_SLUG_LEN } from '../../more/utils/businessSlug';

const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

function filterSlugDraft(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, MAX_BUSINESS_SLUG_LEN);
}

/**
 * @param {{ value: string; onChangeValue: (next: string) => void }} props
 */
export function OnboardingSlugStep({ value, onChangeValue }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        slugShell: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder,
          borderRadius: 14,
          borderWidth: 1.5,
          overflow: 'hidden',
        },
        prefixRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        prefixText: {
          color: colors.textMuted,
          fontFamily: mono,
          fontSize: 14,
          fontWeight: '500',
        },
        inputRow: {
          paddingHorizontal: 16,
          paddingVertical: 4,
        },
        slugInput: {
          color: colors.text,
          flex: 1,
          fontFamily: mono,
          fontSize: 16,
          fontWeight: '500',
          minHeight: 44,
          paddingVertical: Platform.select({ android: 6, default: 10 }),
        },
        hint: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 10,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard>
      <View style={styles.slugShell}>
        <View style={styles.prefixRow}>
          <AppText style={styles.prefixText}>{BOOKING_LINK_HOST}/</AppText>
        </View>
        <View style={styles.inputRow}>
          <AppTextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="my-business"
            placeholderTextColor={colors.placeholder}
            style={styles.slugInput}
            value={value}
            onChangeText={(t) => onChangeValue(filterSlugDraft(t))}
          />
        </View>
      </View>
      <AppText style={styles.hint}>Use letters, numbers, and hyphens only.</AppText>
    </SurfaceCard>
  );
}
