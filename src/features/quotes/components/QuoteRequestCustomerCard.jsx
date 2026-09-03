import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { customerInitials } from '../../customers/customer-details/utils/customerInitials';
import { fireLightImpactHaptic } from '../../../utils/feedbackHaptics';
import { formatPhoneWithCountryCode, phoneForSmsUri } from '../../../utils/phone';
import { openNativeSms } from '../../../utils/openNativeSms';

const COPIED_GREEN = '#22c55e';
const CONTACT_ICON_SIZE = 18;
const CONTACT_LINE_HEIGHT = 20;
const CONTACT_ICON_PAD_TOP = Math.max(0, Math.round((CONTACT_LINE_HEIGHT - CONTACT_ICON_SIZE) / 2));

/**
 * Quote request customer — same contact card language as customer details.
 * Phone sits on the left; a text icon on the right opens Messages.
 *
 * @param {object} props
 * @param {string} [props.customerName]
 * @param {string} [props.phone]
 * @param {string} [props.email]
 */
export function QuoteRequestCustomerCard({ customerName = '', phone = '', email = '' }) {
  const { colors, isDark } = useTheme();
  const [emailCopied, setEmailCopied] = useState(false);

  const name = String(customerName ?? '').trim() || 'Customer';
  const initials = useMemo(() => customerInitials(name), [name]);
  const phoneUri = phoneForSmsUri(phone);
  const phoneDisplay = String(formatPhoneWithCountryCode(phone) ?? '').trim();
  const emailDisplay = String(email ?? '').trim();
  const canReachPhone = Boolean(phoneUri);

  useEffect(() => {
    if (!emailCopied) return undefined;
    const t = setTimeout(() => setEmailCopied(false), 2000);
    return () => clearTimeout(t);
  }, [emailCopied]);

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
      noAddressMessage: 'This request has no phone number.',
    });
  }, [phoneUri]);

  const handleCopyEmail = useCallback(() => {
    if (!emailDisplay) return;
    void (async () => {
      await Clipboard.setStringAsync(emailDisplay);
      fireLightImpactHaptic();
      setEmailCopied(true);
    })();
  }, [emailDisplay]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingVertical: 16,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.cardBorder,
          borderRadius: 24,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        initials: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.35,
        },
        nameCol: {
          flex: 1,
          minWidth: 0,
          marginLeft: 12,
        },
        name: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 26,
        },
        dividerWrap: {
          marginBottom: 10,
          marginTop: 14,
        },
        contactBlock: {
          rowGap: 4,
        },
        press: {
          alignSelf: 'stretch',
          borderRadius: 10,
          marginHorizontal: -6,
          paddingHorizontal: 6,
          paddingVertical: 6,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        iconRail: {
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: CONTACT_ICON_PAD_TOP,
          width: 28,
        },
        callCol: {
          flex: 1,
          minWidth: 0,
        },
        valueCol: {
          flex: 1,
          minWidth: 0,
          marginLeft: 10,
        },
        value: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: CONTACT_LINE_HEIGHT,
        },
        phoneValue: {
          color: colors.linkSubtle,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: CONTACT_LINE_HEIGHT,
          textDecorationLine: 'underline',
        },
        emailValue: {
          color: colors.linkSubtle,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: CONTACT_LINE_HEIGHT,
          textDecorationLine: 'underline',
        },
        textWell: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(10,10,10,0.08)',
          borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(10,10,10,0.10)',
          borderRadius: 18,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        copiedSlot: {
          alignItems: 'center',
          height: CONTACT_LINE_HEIGHT,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [colors, isDark],
  );

  const showContact = Boolean(phoneDisplay || emailDisplay);

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <AppText style={styles.initials}>{initials}</AppText>
        </View>
        <View style={styles.nameCol}>
          <AppText numberOfLines={2} style={styles.name}>
            {name}
          </AppText>
        </View>
      </View>

      {showContact ? (
        <>
          <View style={styles.dividerWrap}>
            <Divider />
          </View>
          <View style={styles.contactBlock}>
            {phoneDisplay ? (
              <View style={styles.press}>
                <View style={styles.row}>
                  <View style={styles.callCol}>
                    <Pressable
                      accessibilityHint="Opens Phone to call this customer"
                      accessibilityLabel={`Call ${phoneDisplay}`}
                      accessibilityRole="button"
                      disabled={!canReachPhone}
                      onPress={handleCall}
                    >
                      {({ pressed }) => (
                        <View
                          style={[styles.row, pressed && canReachPhone ? { opacity: 0.65 } : null]}
                        >
                          <View style={styles.iconRail}>
                            <Ionicons
                              color={canReachPhone ? colors.textMuted : colors.placeholder}
                              name="call-outline"
                              size={CONTACT_ICON_SIZE}
                            />
                          </View>
                          <View style={styles.valueCol}>
                            <AppText
                              numberOfLines={1}
                              style={canReachPhone ? styles.phoneValue : styles.value}
                            >
                              {phoneDisplay}
                            </AppText>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </View>
                  {canReachPhone ? (
                    <Pressable
                      accessibilityHint="Opens Messages to text this customer"
                      accessibilityLabel={`Text ${phoneDisplay}`}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={handleText}
                    >
                      {({ pressed }) => (
                        <View style={[styles.textWell, pressed ? { opacity: 0.72 } : null]}>
                          <Ionicons color={colors.text} name="chatbubble-ellipses" size={18} />
                        </View>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {emailDisplay ? (
              <Pressable
                accessibilityHint="Copies this email address"
                accessibilityLabel={`Copy email ${emailDisplay}`}
                accessibilityRole="button"
                onPress={handleCopyEmail}
              >
                {({ pressed }) => (
                  <View style={[styles.press, pressed ? { opacity: 0.65 } : null]}>
                    <View style={styles.row}>
                      <View style={styles.iconRail}>
                        <Ionicons
                          color={colors.textMuted}
                          name="mail-outline"
                          size={CONTACT_ICON_SIZE}
                        />
                      </View>
                      <View style={styles.valueCol}>
                        <AppText numberOfLines={1} style={styles.emailValue}>
                          {emailDisplay}
                        </AppText>
                      </View>
                      <View style={styles.copiedSlot}>
                        {emailCopied ? (
                          <Ionicons
                            color={COPIED_GREEN}
                            name="checkmark-circle"
                            size={CONTACT_ICON_SIZE}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </SurfaceCard>
  );
}
