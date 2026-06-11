import { Button, EchoBarsLoader } from '../../../../components/ui';

/** Echo bar color on the primary CTA (white fill in dark theme). */
const PRIMARY_ECHO_BAR_COLOR = '#0a0a0a';

/**
 * UI for texting the customer "on my way" from booking details.
 * Wire `onPress` / `loading` when hooking up {@link useBookingAction}.
 *
 * @param {{
 *   alreadySent?: boolean;
 *   disabled?: boolean;
 *   hasCustomerSmsPhone?: boolean;
 *   loading?: boolean;
 *   onPress?: () => void;
 * }} props
 */
export function BookingOnMyWayActionRow({
  alreadySent = false,
  disabled = false,
  hasCustomerSmsPhone = false,
  loading = false,
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
          ? 'Texts the customer that you are on the way'
          : 'Updates the appointment; add a phone on this booking to text the customer'
      }
      accessibilityLabel="On my way"
      disabled={disabled}
      fullWidth
      iconName="chatbubble-ellipses-outline"
      loading={loading}
      loadingNode={<EchoBarsLoader accessibilityLabel="Sending" color={PRIMARY_ECHO_BAR_COLOR} />}
      title="On my way"
      variant="primary"
      onPress={onPress}
    />
  );
}
