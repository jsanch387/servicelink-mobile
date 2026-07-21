import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, SurfaceTextField, SelectField } from '../../../components/ui';
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
 * Location collection modal using announcement pattern.
 * Uses single autocomplete input for location (future: will integrate with location service).
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
        // If user only enters one part, treat it as city
        city = parts[0];
      }

      await onSave?.({
        location: locationText,
        city,
        state,
        radius: parseInt(radius, 10),
      });

      // Clear form after successful save
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
          paddingHorizontal: 22,
          paddingTop: Math.max(insets.top, 16),
        },
        card: {
          alignSelf: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 22,
          borderWidth: 1,
          elevation: 16,
          maxWidth: 400,
          overflow: 'hidden',
          paddingBottom: 22,
          paddingHorizontal: 24,
          paddingTop: 26,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 36,
          width: '100%',
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
          marginBottom: 18,
          width: 48,
        },
        badge: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderRadius: 999,
          marginBottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        badgeText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.7,
          lineHeight: 32,
          marginBottom: 18,
        },
        bulletList: {
          gap: 12,
          marginBottom: 18,
        },
        bulletRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        bulletDot: {
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 999,
          height: 6,
          marginTop: 8,
          width: 6,
        },
        bulletText: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        formSection: {
          marginBottom: 18,
        },
        fieldSpacing: {
          marginBottom: 16,
        },
        helperText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 6,
        },
        actions: {
          gap: 10,
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
      onRequestClose={handleSkip}
    >
      <View style={styles.fill}>
        <Animated.View style={[styles.fill, { opacity }]}>
          <Pressable
            accessibilityLabel="Skip location setup"
            accessibilityRole="button"
            style={styles.fill}
            onPress={handleSkip}
          >
            <View style={styles.backdrop} />
          </Pressable>
        </Animated.View>

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <View style={styles.card}>
              <View style={styles.accentBar} />
              <View style={styles.iconBadge}>
                <Ionicons color={colors.text} name="location-outline" size={24} />
              </View>
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>Get more bookings</AppText>
              </View>
              <AppText style={styles.title}>Where do you service?</AppText>

              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <AppText style={styles.bulletText}>
                    Get matched with nearby customers looking for detailing
                  </AppText>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <AppText style={styles.bulletText}>
                    Show up in local searches so customers can find you
                  </AppText>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <AppText style={styles.bulletText}>
                    Fill your schedule faster with bookings from your area
                  </AppText>
                </View>
              </View>

              <View style={styles.formSection}>
                <View style={styles.fieldSpacing}>
                  <SurfaceTextField
                    autoCapitalize="words"
                    label="Your location"
                    placeholder="Austin, TX"
                    value={locationInput}
                    onChangeText={setLocationInput}
                  />
                  <AppText style={styles.helperText}>
                    Type your city and state (e.g., Austin, TX)
                  </AppText>
                </View>

                <SelectField
                  label="Service radius"
                  options={RADIUS_OPTIONS}
                  value={radius}
                  onValueChange={setRadius}
                />
                <AppText style={styles.helperText}>
                  Select the maximum distance you'll travel from your location to service customers
                </AppText>
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
                  variant="secondary"
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
