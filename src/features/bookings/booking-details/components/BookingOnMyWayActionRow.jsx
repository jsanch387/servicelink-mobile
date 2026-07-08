import { Button } from '../../../../components/ui';

/**
 * Opens the device Messages app with a prefilled "On my way" text from booking details.
 *
 * @param {{
 *   alreadySent?: boolean;
 *   disabled?: boolean;
 *   hasCustomerSmsPhone?: boolean;
 *   onPress?: () => void;
 * }} props
 */
export function BookingOnMyWayActionRow({
  alreadySent = false,
  disabled = false,
  hasCustomerSmsPhone = false,
  onPress,
}) {
  if (alreadySent) {
    return (
      <Button
        accessibilityLabel="Customer notified"
        disabled
        fullWidth
        iconColor="#ffffff"
        iconName="checkmark-circle-outline"
        subduedWhenDisabled={false}
        title="Customer notified"
        variant="secondary"
      />
    );
  }

  return (
    <Button
      accessibilityHint={
        hasCustomerSmsPhone
          ? 'Opens Messages with On my way prefilled'
          : 'Opens Messages; add a phone on this booking to prefill the customer number'
      }
      accessibilityLabel="On my way"
      disabled={disabled}
      fullWidth
      iconName="chatbubble-ellipses-outline"
      title="On my way"
      variant="secondary"
      onPress={onPress}
    />
  );
}
