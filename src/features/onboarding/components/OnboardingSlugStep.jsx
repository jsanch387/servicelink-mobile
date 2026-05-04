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
        cardTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 12,
        },
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
        footerRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        },
        hint: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          marginRight: 12,
        },
        counter: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard>
      <AppText style={styles.cardTitle}>Your link</AppText>
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
      <View style={styles.footerRow}>
        <AppText style={styles.hint}>
          Use letters, numbers, and hyphens only (e.g. elite-detail).
        </AppText>
        <AppText style={styles.counter}>
          {value.length}/{MAX_BUSINESS_SLUG_LEN}
        </AppText>
      </View>
    </SurfaceCard>
  );
}
