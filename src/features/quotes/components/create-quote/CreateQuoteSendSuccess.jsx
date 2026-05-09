import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/** Same green as add-customer success — readable on light + dark shells. */
const SUCCESS_GREEN = '#22c55e';

/**
 * Shown after a quote is sent successfully (replaces review body). Centered, minimal copy —
 * assumes the server emailed the customer the link.
 *
 * @param {object} props
 * @param {string} props.customerEmail
 */
export function CreateQuoteSendSuccess({ customerEmail }) {
  const { colors } = useTheme();
  const email = String(customerEmail ?? '').trim();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          width: '100%',
        },
        iconWrap: {
          marginBottom: 20,
        },
        title: {
          alignSelf: 'stretch',
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 28,
          marginBottom: 14,
          textAlign: 'center',
        },
        body: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 24,
          textAlign: 'center',
        },
        email: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel="Quote sent successfully"
        accessibilityRole="image"
        style={styles.iconWrap}
      >
        <Ionicons color={SUCCESS_GREEN} name="checkmark-circle" size={64} />
      </View>
      <AppText style={styles.title}>Quote sent</AppText>
      {email ? (
        <AppText style={styles.body}>
          We&apos;ve sent the quote to <AppText style={styles.email}>{email}</AppText> so they can
          accept or decline.
        </AppText>
      ) : (
        <AppText style={styles.body}>
          We&apos;ve sent the quote to your customer so they can accept or decline.
        </AppText>
      )}
    </View>
  );
}
