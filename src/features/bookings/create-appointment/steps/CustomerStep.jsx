import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  RequiredFieldLabel,
  SurfaceCard,
  SurfaceEmailField,
  SurfacePhoneField,
  SurfaceTextField,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { isValidEmailFormat } from '../../../../utils/email';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * @param {object} props
 * @param {{ fullName: string; email: string; phone: string }} props.customer
 * @param {(next: object) => void} props.onChangeCustomer
 * @param {boolean} [props.isReturningCustomer] true when fields were pre-filled from an existing
 *   customer profile (see `CustomerDetailsScreen` "Create appointment" action)
 */
export function CustomerStep({ customer, isReturningCustomer = false, onChangeCustomer }) {
  const { colors } = useTheme();

  const emailTrim = String(customer.email ?? '').trim();
  const emailError = useMemo(() => {
    if (!emailTrim) return undefined;
    if (!isValidEmailFormat(emailTrim)) return 'Enter a valid email address.';
    return undefined;
  }, [emailTrim]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fieldStack: {
          gap: 18,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        footnote: {
          color: colors.placeholder,
          fontSize: 12,
          flex: 1,
          lineHeight: 16,
        },
        emailGroup: {
          gap: 6,
        },
        infoRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 5,
          opacity: 0.95,
          paddingHorizontal: 2,
        },
        returningBanner: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        returningBannerText: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors.accent, colors.placeholder],
  );

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.fieldStack}>
        {isReturningCustomer ? (
          <View style={styles.returningBanner}>
            <Ionicons color={colors.accent} name="repeat-outline" size={15} />
            <AppText style={styles.returningBannerText}>
              Pre-filled from this customer&apos;s profile
            </AppText>
          </View>
        ) : null}
        <SurfaceTextField
          autoCapitalize="words"
          compact
          containerStyle={FIELD_SHELL}
          label={<RequiredFieldLabel compact text="Full name" />}
          maxLength={120}
          placeholder="Jordan Lee"
          testID="create-appt-customer-name"
          value={customer.fullName}
          onChangeText={(t) => onChangeCustomer({ ...customer, fullName: t })}
        />
        <SurfacePhoneField
          compact
          containerStyle={FIELD_SHELL}
          label={<RequiredFieldLabel compact text="Phone" />}
          placeholder="(555) 234-5678"
          prefixText="+1"
          testID="create-appt-customer-phone"
          value={customer.phone}
          onChangeText={(t) => onChangeCustomer({ ...customer, phone: t })}
        />
        <View style={styles.emailGroup}>
          <SurfaceEmailField
            compact
            containerStyle={FIELD_SHELL}
            errorText={emailError}
            label="Email (optional)"
            leftIcon="mail-outline"
            placeholder="jordan@email.com"
            value={customer.email}
            onChangeText={(t) => onChangeCustomer({ ...customer, email: t })}
          />
          {!emailTrim ? (
            <View style={styles.infoRow}>
              <Ionicons color={colors.placeholder} name="information-circle-outline" size={14} />
              <AppText style={styles.footnote}>No email, no confirmation will be sent.</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}
