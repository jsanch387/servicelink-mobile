import { SurfaceTextField } from './SurfaceTextField';
import { formatPhoneInputAsYouType, US_NANP_FORMATTED_MAX_LENGTH } from '../../utils/phone';

/**
 * US NANP phone `SurfaceTextField` — formatted as you type, hard `maxLength` so extra digits
 * cannot flash in the native control.
 *
 * @param {import('react').ComponentProps<typeof SurfaceTextField>} props
 */
export function SurfacePhoneField({ label = 'Phone (optional)', onChangeText, ...rest }) {
  return (
    <SurfaceTextField
      keyboardType="phone-pad"
      label={label}
      maxLength={US_NANP_FORMATTED_MAX_LENGTH}
      {...rest}
      onChangeText={(t) => onChangeText(formatPhoneInputAsYouType(t))}
    />
  );
}
