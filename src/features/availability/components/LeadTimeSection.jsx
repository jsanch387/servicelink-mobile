import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SelectField, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MINIMUM_NOTICE_OPTIONS } from '../utils/availabilityModel';

/**
 * Lead time picker — matches Time off / weekly schedule section chrome.
 *
 * @param {{
 *   value: string;
 *   onValueChange: (next: string) => void;
 *   style?: object;
 * }} props
 */
export function LeadTimeSection({ value, onValueChange, style }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: 14,
        },
        titleRow: {
          marginBottom: 8,
          marginTop: 4,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
        },
        card: {
          borderRadius: 14,
          overflow: 'hidden',
          paddingHorizontal: 4,
          paddingVertical: 2,
        },
        trigger: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleRow}>
        <AppText style={styles.sectionTitle}>Lead time</AppText>
      </View>
      <SurfaceCard style={styles.card}>
        <SelectField
          fieldStyle={{ marginTop: 0 }}
          options={MINIMUM_NOTICE_OPTIONS}
          presentation="wheel"
          title="Lead time"
          triggerStyle={styles.trigger}
          value={value}
          onValueChange={onValueChange}
        />
      </SurfaceCard>
    </View>
  );
}
