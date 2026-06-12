import { Ionicons } from '@expo/vector-icons';
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
 * @param {{ children: string; colors: ReturnType<typeof useTheme>['colors'] }} props
 */
function ConfirmationFieldHint({ children, colors }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 5,
          marginTop: 7,
          paddingLeft: 1,
        },
        icon: {
          marginTop: 1,
        },
        text: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 11,
          fontWeight: '400',
          lineHeight: 15,
          minWidth: 0,
          opacity: 0.9,
        },
      }),
    [colors.textMuted],
  );

  return (
    <View style={styles.row}>
      <Ionicons
        color={colors.textMuted}
        name="information-circle-outline"
        size={14}
        style={styles.icon}
      />
      <AppText style={styles.text}>{children}</AppText>
    </View>
  );
}

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
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        fieldStack: {
          gap: 18,
        },
      }),
    [],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.fieldStack}>
        <SurfaceTextField
          autoCapitalize="words"
          compact
          containerStyle={FIELD_SHELL}
          label="Customer name"
          placeholder="Jordan Lee"
          value={customer.fullName}
          onChangeText={(t) => onChangeCustomer({ ...customer, fullName: t })}
        />
        <View>
          <SurfacePhoneField
            compact
            containerStyle={FIELD_SHELL}
            label="Phone"
            leftIcon="call-outline"
            placeholder="(555) 234-5678"
            value={customer.phone}
            onChangeText={(t) => onChangeCustomer({ ...customer, phone: t })}
          />
          <ConfirmationFieldHint colors={colors}>
            A text confirmation will be sent.
          </ConfirmationFieldHint>
        </View>
        <View>
          <SurfaceEmailField
            compact
            containerStyle={FIELD_SHELL}
            errorText={emailError}
            label="Email"
            leftIcon="mail-outline"
            placeholder="jordan@email.com"
            value={customer.email}
            onChangeText={(t) => onChangeCustomer({ ...customer, email: t })}
          />
          {emailTrim ? (
            <ConfirmationFieldHint colors={colors}>
              An email confirmation will be sent.
            </ConfirmationFieldHint>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}
