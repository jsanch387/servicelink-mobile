import { SurfaceTextField } from './SurfaceTextField';

/**
 * Email-shaped `SurfaceTextField` for reuse (create quote, sheets, etc.).
 *
 * @param {import('react').ComponentProps<typeof SurfaceTextField>} props
 */
export function SurfaceEmailField({ label = 'Email', maxLength = 254, ...rest }) {
  return (
    <SurfaceTextField
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      label={label}
      maxLength={maxLength}
      {...rest}
    />
  );
}
