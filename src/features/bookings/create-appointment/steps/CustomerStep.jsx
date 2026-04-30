import { View } from 'react-native';
import { SurfaceTextField } from '../../../../components/ui';
import { formatPhoneInputAsYouType, US_NANP_FORMATTED_MAX_LENGTH } from '../../../../utils/phone';

export function CustomerStep({ customer, onChangeCustomer }) {
  return (
    <View>
      <SurfaceTextField
        autoCapitalize="words"
        compact
        label="Full name"
        placeholder="Jordan Lee"
        value={customer.fullName}
        onChangeText={(t) => onChangeCustomer({ ...customer, fullName: t })}
      />
      <SurfaceTextField
        autoCapitalize="none"
        autoCorrect={false}
        compact
        keyboardType="email-address"
        label="Email"
        leftIcon="mail-outline"
        placeholder="jordan@email.com"
        value={customer.email}
        onChangeText={(t) => onChangeCustomer({ ...customer, email: t })}
      />
      <SurfaceTextField
        compact
        keyboardType="phone-pad"
        label="Phone"
        leftIcon="call-outline"
        maxLength={US_NANP_FORMATTED_MAX_LENGTH}
        placeholder="(555) 123-4567"
        value={customer.phone}
        onChangeText={(t) => onChangeCustomer({ ...customer, phone: formatPhoneInputAsYouType(t) })}
      />
    </View>
  );
}
