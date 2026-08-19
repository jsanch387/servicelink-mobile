import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatPhoneWithCountryCode, phoneForSmsUri } from '../../../utils/phone';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {keyof typeof Ionicons.glyphMap} props.icon
 * @param {() => void} [props.onPress]
 * @param {string} [props.accessibilityLabel]
 * @param {boolean} [props.showDivider]
 */
function ContactRow({ label, value, icon, onPress, accessibilityLabel, showDivider = false }) {
  const { colors, isDark } = useTheme();
  const interactive = typeof onPress === 'function';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 48,
          marginVertical: 12,
          opacity: 0.9,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.shellElevated,
          borderRadius: 10,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          marginBottom: 2,
        },
        value: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
        },
        actionCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
      }),
    [colors, isDark],
  );

  const body = (
    <View style={styles.row}>
      <View style={styles.iconBadge}>
        <Ionicons color={colors.accentMuted} name={icon} size={17} />
      </View>
      <View style={styles.textCol}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText numberOfLines={2} style={styles.value}>
          {value}
        </AppText>
      </View>
      {interactive ? (
        <View style={styles.actionCol}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.wrap}>
      {showDivider ? <View style={styles.divider} /> : null}
      {interactive ? (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={onPress}
        >
          {({ pressed }) => <View style={pressed ? { opacity: 0.75 } : null}>{body}</View>}
        </Pressable>
      ) : (
        body
      )}
    </View>
  );
}

/**
 * Subscriber detail — polished contact block (phone / email).
 *
 * @param {object} props
 * @param {string} [props.email]
 * @param {string} [props.phone]
 */
export function SubscriberCustomerCard({ email = '', phone = '' }) {
  const { colors } = useTheme();
  const emailTrim = String(email ?? '').trim();
  const phoneRaw = String(phone ?? '').trim();
  const phoneDisplay = phoneRaw ? formatPhoneWithCountryCode(phoneRaw) || phoneRaw : '';
  const telUri = phoneRaw ? phoneForSmsUri(phoneRaw) : null;
  const hasAny = Boolean(emailTrim || phoneDisplay);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
          paddingVertical: 6,
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Contact">
      {!hasAny ? (
        <AppText style={styles.empty}>No phone or email on file.</AppText>
      ) : (
        <View>
          {phoneDisplay ? (
            <ContactRow
              accessibilityLabel={telUri ? `Call ${phoneDisplay}` : undefined}
              icon="call-outline"
              label="Phone"
              value={phoneDisplay}
              onPress={
                telUri
                  ? () => {
                      void Linking.openURL(`tel:${telUri}`).catch(() => {});
                    }
                  : undefined
              }
            />
          ) : null}
          {emailTrim ? (
            <ContactRow
              icon="mail-outline"
              label="Email"
              showDivider={Boolean(phoneDisplay)}
              value={emailTrim}
            />
          ) : null}
        </View>
      )}
    </DetailsSectionCard>
  );
}
