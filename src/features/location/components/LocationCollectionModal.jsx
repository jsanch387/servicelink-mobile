import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Divider, SurfaceTextField, SelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';

const RADIUS_OPTIONS = [
  { label: 'Up to 5 miles', value: '5' },
  { label: 'Up to 10 miles', value: '10' },
  { label: 'Up to 15 miles', value: '15' },
  { label: 'Up to 20 miles', value: '20' },
  { label: 'Up to 25 miles', value: '25' },
  { label: 'Up to 30 miles', value: '30' },
  { label: 'Up to 40 miles', value: '40' },
  { label: 'Up to 50 miles', value: '50' },
  { label: 'Up to 75 miles', value: '75' },
  { label: 'Up to 100 miles', value: '100' },
  { label: 'Up to 150 miles', value: '150' },
  { label: 'Up to 200 miles', value: '200' },
];

/**
 * Compact location collection modal.
 * Collects service location + radius for marketplace matching.
 *
 * @param {{
 *   visible?: boolean;
 *   onDismiss: () => void;
 *   onSave: (data: { location: string, city: string, state: string, radius: number }) => Promise<void>;
 * }} props
 */
export function LocationCollectionModal({ visible = false, onDismiss, onSave }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  const [locationInput, setLocationInput] = useState('');
  const [radius, setRadius] = useState('15');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.94);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 68,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  const canSave = Boolean(locationInput.trim() && radius);

  const handleSave = async () => {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    try {
      // TODO: When location service is integrated, this will parse the selected
      // autocomplete result. For now, we'll parse the input manually.
      // Expected format: "City, ST" (e.g., "Austin, TX")
      const locationText = locationInput.trim();
      const parts = locationText.split(',').map((p) => p.trim());

      let city = '';
      let state = '';

      if (parts.length >= 2) {
        city = parts[0];
        state = parts[1].toUpperCase().slice(0, 2);
      } else if (parts.length === 1) {
        city = parts[0];
      }

      await onSave?.({
        location: locationText,
        city,
        state,
        radius: parseInt(radius, 10),
      });

      setLocationInput('');
      setRadius('15');
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
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.62)',
        },
        centerLayer: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 16),
        },
        card: {
          alignSelf: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 18,
          borderWidth: 1,
          elevation: 16,
          overflow: 'hidden',
          paddingBottom: 16,
          paddingHorizontal: 20,
          paddingTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 28,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          height: 40,
          justifyContent: 'center',
          marginBottom: 14,
          width: 40,
        },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 26,
          marginBottom: 6,
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 14,
          textAlign: 'center',
        },
        headerDivider: {
          marginBottom: 16,
        },
        formSection: {
          marginBottom: 16,
        },
        actions: {
          gap: 4,
        },
      }),
    [colors, isDark, insets.bottom, insets.top],
  );

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.fill}>
        <Animated.View style={[styles.fill, { opacity }]}>
          <View style={styles.backdrop} />
        </Animated.View>

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <View style={styles.card}>
              <View style={styles.iconBadge}>
                <Ionicons color={colors.text} name="location-outline" size={22} />
              </View>
              <AppText style={styles.title}>Please update your location</AppText>
              <AppText style={styles.subtitle}>
                This helps customers find you more easily and book with you.
              </AppText>
              <Divider style={styles.headerDivider} />

              <View style={styles.formSection}>
                <SurfaceTextField
                  autoCapitalize="words"
                  compact
                  containerStyle={{ marginBottom: 10 }}
                  label="Location"
                  placeholder="Search city or address"
                  value={locationInput}
                  onChangeText={setLocationInput}
                />

                <SelectField
                  fieldStyle={{ marginTop: 0 }}
                  label="Service radius"
                  options={RADIUS_OPTIONS}
                  presentation="wheel"
                  value={radius}
                  onValueChange={setRadius}
                />
              </View>

              <View style={styles.actions}>
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
                  title="I'll do this later"
                  variant="ghost"
                  onPress={handleSkip}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
