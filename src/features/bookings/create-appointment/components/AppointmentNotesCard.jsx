import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function AppointmentNotesCard({ notes, onChangeNotes }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: 8,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        input: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
          minHeight: 120,
          paddingBottom: 2,
          paddingTop: 2,
          textAlignVertical: 'top',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <AppText style={styles.title}>Notes</AppText>
      <SurfaceCard padding="none" style={styles.card}>
        <AppTextInput
          autoCapitalize="sentences"
          maxLength={280}
          multiline
          placeholder="Optional notes for this booking."
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          value={notes}
          onChangeText={onChangeNotes}
        />
      </SurfaceCard>
    </View>
  );
}
