import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
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
 */
export function CustomerStep({ customer, onChangeCustomer }) {
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
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 4,
        },
      }),
    [colors.textMuted],
  );

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.fieldStack}>
        <SurfaceTextField
          autoCapitalize="words"
          compact
          containerStyle={FIELD_SHELL}
          label="Full name"
          placeholder="Jordan Lee"
          value={customer.fullName}
          onChangeText={(t) => onChangeCustomer({ ...customer, fullName: t })}
        />
        <SurfacePhoneField
          compact
          containerStyle={FIELD_SHELL}
          label="Phone"
          leftIcon="call-outline"
          placeholder="(555) 234-5678"
          value={customer.phone}
          onChangeText={(t) => onChangeCustomer({ ...customer, phone: t })}
        />
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
        <AppText style={styles.footnote}>No email, no confirmation will be sent.</AppText>
      </View>
    </SurfaceCard>
  );
}
