import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const CARD_RADIUS = 16;
const BUTTON_SIZE = 48;

/**
 * Address with a directions button.
 *
 * @param {object} props
 * @param {{ primary?: string, secondary?: string, address?: string }} props.location
 * @param {() => void} [props.onOpenMaps]
 */
export function BookingLocationCard({ location, onOpenMaps }) {
  const { colors } = useTheme();
  const street = String(location?.primary || location?.address || '').trim();
  const locality = String(location?.secondary ?? '').trim();
  const label = locality ? `${street}, ${locality}` : street;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: CARD_RADIUS,
        },
        body: {
          alignItems: 'center',
          flexDirection: 'row',
          padding: 12,
          width: '100%',
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        street: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        locality: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.1,
          marginTop: 2,
        },
        directions: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 14,
          height: BUTTON_SIZE,
          justifyContent: 'center',
          width: BUTTON_SIZE,
        },
        pressed: {
          opacity: 0.82,
        },
      }),
    [colors],
  );

  if (!street) return null;

  return (
    <DetailsSectionCard flush cardStyle={styles.card} title="Location">
      <View style={styles.body}>
        <View style={styles.textCol}>
          <AppText style={styles.street}>{street}</AppText>
          {locality ? <AppText style={styles.locality}>{locality}</AppText> : null}
        </View>
        {typeof onOpenMaps === 'function' ? (
          <Pressable
            accessibilityHint="Opens this address in Maps"
            accessibilityLabel={label ? `Directions to ${label}` : 'Get directions'}
            accessibilityRole="button"
            onPress={onOpenMaps}
          >
            {({ pressed }) => (
              <View style={[styles.directions, pressed && styles.pressed]}>
                <Ionicons color={colors.buttonPrimaryText} name="navigate" size={22} />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>
    </DetailsSectionCard>
  );
}
