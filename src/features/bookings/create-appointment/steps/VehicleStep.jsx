import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const FIELD_SHELL = { marginBottom: 0 };

/** US model years are typically 4 digits; strip anything that is not 0–9. */
function sanitizeVehicleYearInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 4);
}

export function VehicleStep({ vehicle, notes, onChangeVehicle, onChangeNotes }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 18,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        fieldStack: {
          gap: 18,
        },
        notesSection: {
          gap: 8,
        },
        notesTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        notesCard: {
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        notesInput: {
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
    <View style={styles.root}>
      <SurfaceCard padding="none" style={styles.card}>
        <View style={styles.fieldStack}>
          <SurfaceTextField
            autoCapitalize="none"
            autoCorrect={false}
            compact
            containerStyle={FIELD_SHELL}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Year"
            maxLength={4}
            placeholder="2022"
            value={vehicle.year}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, year: sanitizeVehicleYearInput(t) })}
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Make"
            placeholder="Toyota"
            value={vehicle.make}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, make: t })}
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Model"
            placeholder="Camry"
            value={vehicle.model}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, model: t })}
          />
        </View>
      </SurfaceCard>

      <View style={styles.notesSection}>
        <AppText style={styles.notesTitle}>Notes</AppText>
        <SurfaceCard padding="none" style={styles.notesCard}>
          <AppTextInput
            autoCapitalize="sentences"
            multiline
            placeholder="Optional notes for this booking."
            placeholderTextColor={colors.placeholder}
            style={styles.notesInput}
            value={notes}
            onChangeText={onChangeNotes}
          />
        </SurfaceCard>
      </View>
    </View>
  );
}
