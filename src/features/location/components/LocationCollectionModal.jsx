import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, SurfaceTextField, SelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';

const RADIUS_OPTIONS = [
  { label: '5 miles', value: '5' },
  { label: '10 miles', value: '10' },
  { label: '15 miles', value: '15' },
  { label: '20 miles', value: '20' },
  { label: '25 miles', value: '25' },
  { label: '30 miles', value: '30' },
  { label: '40 miles', value: '40' },
  { label: '50 miles', value: '50' },
  { label: '75 miles', value: '75' },
  { label: '100 miles', value: '100' },
];

export function LocationCollectionModal({ visible = false, onDismiss, onSave }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [radius, setRadius] = useState('15');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = Boolean(city.trim() && state.trim() && radius);

  const handleSave = async () => {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave?.({
        city: city.trim(),
        state: state.trim().toUpperCase(),
        radius: parseInt(radius, 10),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onDismiss?.();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          ...StyleSheet.absoluteFillObject,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.82)' : 'rgba(0, 0, 0, 0.48)',
        },
        centerLayer: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 22,
          paddingTop: Math.max(insets.top, 16),
        },
        card: {
          alignSelf: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 22,
          borderWidth: 1,
          maxWidth: 400,
          overflow: 'hidden',
          paddingHorizontal: 24,
          paddingTop: 26,
          paddingBottom: 22,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 36,
          elevation: 16,
        },
        accentBar: {
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 3,
          height: 3,
          marginBottom: 18,
          width: 44,
        },
        iconBadge: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          marginBottom: 22,
          width: 48,
        },
        kicker: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 10,
        },
        title: {
          color: colors.text,
          fontSize: 24,
          fontWeight: '800',
          letterSpacing: -0.6,
          lineHeight: 30,
          marginBottom: 18,
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 24,
          marginBottom: 20,
        },
        benefitsBox: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderLeftColor: colors.buttonPrimaryBg,
          borderLeftWidth: 3,
          borderRadius: 14,
          borderWidth: 1,
          marginBottom: 20,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        benefitText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 21,
          marginBottom: 4,
        },
        benefitTextLast: {
          marginBottom: 0,
        },
        formSection: {
          marginBottom: 20,
        },
        locationRow: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 16,
        },
        cityField: {
          flex: 1,
        },
        stateField: {
          width: 80,
        },
        rule: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginBottom: 14,
          opacity: isDark ? 0.55 : 0.85,
        },
        buttonRow: {
          gap: 12,
        },
        skipButton: {
          marginTop: 8,
        },
      }),
    [colors, isDark, insets.bottom, insets.top],
  );

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={handleSkip}
    >
      <View style={styles.fill}>
        <Pressable
          accessibilityLabel="Skip"
          accessibilityRole="button"
          style={styles.fill}
          onPress={handleSkip}
        >
          <View style={styles.backdrop} />
        </Pressable>

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <View style={styles.card}>
            <View style={styles.accentBar} />
            <View style={styles.iconBadge}>
              <Ionicons color={colors.text} name="location-outline" size={24} />
            </View>
            <AppText style={styles.kicker}>Get more bookings</AppText>
            <AppText style={styles.title}>Where do you service?</AppText>
            <AppText style={styles.body}>
              Help us connect you with customers in your area. Let them know where you work and how
              far you travel.
            </AppText>
            <View style={styles.benefitsBox}>
              <AppText style={styles.benefitText}>• Get matched with nearby customers</AppText>
              <AppText style={styles.benefitText}>• Show up in local searches</AppText>
              <AppText style={[styles.benefitText, styles.benefitTextLast]}>
                • Fill your schedule faster
              </AppText>
            </View>

            <View style={styles.formSection}>
              <View style={styles.locationRow}>
                <View style={styles.cityField}>
                  <SurfaceTextField
                    autoCapitalize="words"
                    label="City"
                    placeholder="Austin"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={styles.stateField}>
                  <SurfaceTextField
                    autoCapitalize="characters"
                    label="State"
                    maxLength={2}
                    placeholder="TX"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              <SelectField
                label="Service radius"
                options={RADIUS_OPTIONS}
                selectedKey={radius}
                onSelect={setRadius}
              />
            </View>

            <View style={styles.rule} />

            <View style={styles.buttonRow}>
              <Button
                disabled={!canSave}
                fullWidth
                loading={isSaving}
                title="Save location"
                variant="primary"
                onPress={handleSave}
              />
              <Button
                disabled={isSaving}
                fullWidth
                style={styles.skipButton}
                title="I'll do this later"
                variant="ghost"
                onPress={handleSkip}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
