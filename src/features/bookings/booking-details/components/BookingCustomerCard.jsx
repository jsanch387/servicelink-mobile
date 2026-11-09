import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { openNativeSms } from '../../../../utils/openNativeSms';
import { phoneForSmsUri } from '../../../../utils/phone';

const CARD_RADIUS = 16;
const ACTION_SIZE = 44;

/**
 * @param {object} props
 * @param {string} props.accessibilityLabel
 * @param {string} [props.accessibilityHint]
 * @param {keyof typeof Ionicons.glyphMap} props.icon
 * @param {() => void} props.onPress
 */
function ContactAction({ accessibilityLabel, accessibilityHint, icon, onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        face: {
          alignItems: 'center',
          backgroundColor: colors.buttonSecondaryBg,
          borderRadius: 12,
          height: ACTION_SIZE,
          justifyContent: 'center',
          width: ACTION_SIZE,
        },
        pressed: {
          backgroundColor: colors.buttonSecondaryBgPressed,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.face, pressed && styles.pressed]}>
          <Ionicons color={colors.text} name={icon} size={18} />
        </View>
      )}
    </Pressable>
  );
}

/**
 * Customer name, phone, and message / call actions.
 *
 * @param {object} props
 * @param {{ id?: string | null, name?: string, phone?: string }} props.customer
 * @param {() => void} [props.onOpenCustomer]
 */
export function BookingCustomerCard({ customer, onOpenCustomer }) {
  const { colors } = useTheme();
  const name = String(customer?.name ?? '').trim() || 'Customer';
  const phone = String(customer?.phone ?? '').trim();
  const phoneUri = phoneForSmsUri(phone);
  const canOpen = typeof onOpenCustomer === 'function';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: CARD_RADIUS,
        },
        body: {
          padding: 12,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        nameCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        namePressed: {
          opacity: 0.72,
        },
        name: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        meta: {
          color: colors.textMuted,
          fontSize: 14,
          letterSpacing: -0.1,
          marginTop: 2,
        },
        actions: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          gap: 8,
          marginLeft: 12,
        },
      }),
    [colors],
  );

  const handleCall = useCallback(async () => {
    if (!phoneUri) return;
    const telUrl = `tel:${phoneUri}`;
    try {
      if (Platform.OS === 'ios') {
        const supported = await Linking.canOpenURL(telUrl);
        if (!supported) {
          Alert.alert('Unable to open Phone', 'This device cannot place a call.');
          return;
        }
      }
      await Linking.openURL(telUrl);
    } catch {
      Alert.alert('Unable to open Phone', 'This device cannot place a call.');
    }
  }, [phoneUri]);

  const handleText = useCallback(() => {
    if (!phoneUri) return;
    void openNativeSms({
      address: phoneUri,
      noAddressMessage: 'This booking has no phone number.',
    });
  }, [phoneUri]);

  const nameBlock = (
    <View>
      <AppText numberOfLines={2} style={styles.name}>
        {name}
      </AppText>
      {phone ? (
        <AppText numberOfLines={1} style={styles.meta}>
          {phone}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <DetailsSectionCard flush cardStyle={styles.card} title="Customer">
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.nameCol}>
            {canOpen ? (
              <Pressable
                accessibilityHint="Opens this customer"
                accessibilityLabel={`View ${name}`}
                accessibilityRole="button"
                onPress={onOpenCustomer}
              >
                {({ pressed }) => (
                  <View style={pressed ? styles.namePressed : null}>{nameBlock}</View>
                )}
              </Pressable>
            ) : (
              nameBlock
            )}
          </View>
          {phoneUri ? (
            <View style={styles.actions}>
              <ContactAction
                accessibilityHint="Opens Messages to text this customer"
                accessibilityLabel={`Text ${name}`}
                icon="chatbubble-ellipses"
                onPress={handleText}
              />
              <ContactAction
                accessibilityHint="Opens Phone to call this customer"
                accessibilityLabel={`Call ${name}`}
                icon="call"
                onPress={handleCall}
              />
            </View>
          ) : null}
        </View>
      </View>
    </DetailsSectionCard>
  );
}
