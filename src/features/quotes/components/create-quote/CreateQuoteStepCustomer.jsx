import { useMemo, useState } from 'react';
import { SurfaceEmailField, SurfacePhoneField, SurfaceTextField } from '../../../../components/ui';
import { isValidEmailFormat } from '../../../../utils/email';
import { canonicalNanpDigits } from '../../../../utils/phone';
import {
  QUOTE_CUSTOMER_EMAIL_MAX,
  QUOTE_CUSTOMER_NAME_MAX,
} from '../../constants/createQuoteFieldLimits';
import { CreateQuoteFieldStack } from './CreateQuoteFieldStack';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * @param {object} props
 * @param {string} props.customerName
 * @param {(t: string) => void} props.onCustomerNameChange
 * @param {string} props.customerEmail
 * @param {(t: string) => void} props.onCustomerEmailChange
 * @param {string} props.customerPhoneDisplay
 * @param {(t: string) => void} props.onCustomerPhoneChange
 */
export function CreateQuoteStepCustomer({
  customerName,
  onCustomerNameChange,
  customerEmail,
  onCustomerEmailChange,
  customerPhoneDisplay,
  onCustomerPhoneChange,
}) {
  const [nameBlurred, setNameBlurred] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);

  const phoneDigits = useMemo(
    () => canonicalNanpDigits(customerPhoneDisplay),
    [customerPhoneDisplay],
  );

  const nameError = useMemo(() => {
    if (customerName.trim()) return undefined;
    if (customerEmail.trim().length > 0 || phoneDigits.length > 0) {
      return 'Customer name is required.';
    }
    if (nameBlurred) return 'Customer name is required.';
    return undefined;
  }, [customerName, customerEmail, nameBlurred, phoneDigits.length]);

  const emailError = useMemo(() => {
    const e = customerEmail.trim();
    if (!e) return undefined;
    if (!isValidEmailFormat(e)) return 'Enter a valid email address.';
    return undefined;
  }, [customerEmail]);

  const phoneError = useMemo(() => {
    if (!phoneBlurred || phoneDigits.length === 0) return undefined;
    if (phoneDigits.length < 10) return 'Enter a complete 10-digit number, or leave phone blank.';
    return undefined;
  }, [phoneBlurred, phoneDigits.length]);

  return (
    <CreateQuoteFieldStack>
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        errorText={nameError}
        label="Customer name *"
        maxLength={QUOTE_CUSTOMER_NAME_MAX}
        onBlur={() => setNameBlurred(true)}
        onChangeText={onCustomerNameChange}
        placeholder="Jane Doe"
        value={customerName}
      />
      <SurfaceEmailField
        containerStyle={FIELD_SHELL}
        errorText={emailError}
        label="Customer email *"
        maxLength={QUOTE_CUSTOMER_EMAIL_MAX}
        onChangeText={onCustomerEmailChange}
        placeholder="jane@email.com"
        value={customerEmail}
      />
      <SurfacePhoneField
        containerStyle={FIELD_SHELL}
        errorText={phoneError}
        onBlur={() => setPhoneBlurred(true)}
        onChangeText={onCustomerPhoneChange}
        value={customerPhoneDisplay}
      />
    </CreateQuoteFieldStack>
  );
}
