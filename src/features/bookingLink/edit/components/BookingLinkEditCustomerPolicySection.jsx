import { useMemo } from 'react';
import { Switch, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { BOOKING_POLICY_MAX_LENGTH } from '../constants/bookingLinkCustomerPolicy';

export function BookingLinkEditCustomerPolicySection({
  styles,
  policyEnabled,
  onPolicyEnabledChange,
  policyInput,
  onPolicyInputChange,
}) {
  const { colors, isDark } = useTheme();

  const switchTrackColor = useMemo(
    () => ({ false: colors.borderStrong, true: colors.timelineCompletedFill }),
    [colors],
  );

  const count = policyInput.length;

  return (
    <View style={styles.bookingBlock}>
      <AppText style={styles.sectionTitle}>Customer policy</AppText>
      <AppText style={[styles.sectionBody, styles.bookingPolicyHint]}>
        Customers must agree before they can book.
      </AppText>

      <SurfaceCard padding={policyEnabled ? 'md' : 'sm'} style={styles.editSectionCard}>
        <View style={styles.bookingLanguageRowSolo}>
          <AppText style={styles.bookingLanguageLabel}>Require agreement</AppText>
          <Switch
            accessibilityLabel={
              policyEnabled ? 'Require agreement enabled' : 'Require agreement disabled'
            }
            thumbColor={isDark ? '#f8fafc' : '#f4f4f5'}
            trackColor={switchTrackColor}
            value={policyEnabled}
            onValueChange={onPolicyEnabledChange}
          />
        </View>

        {policyEnabled ? (
          <View style={styles.bookingPolicyFields}>
            <AppText style={styles.bookingPolicyLabel}>Policy</AppText>
            <View style={styles.multilineInputShell}>
              <AppTextInput
                accessibilityLabel="Policy"
                maxLength={BOOKING_POLICY_MAX_LENGTH}
                multiline
                nestedScrollEnabled
                placeholder="Write the policy customers agree to"
                placeholderTextColor={colors.placeholder}
                scrollEnabled
                style={styles.multilineInput}
                textAlignVertical="top"
                value={policyInput}
                onChangeText={onPolicyInputChange}
              />
            </View>
            <AppText style={styles.bookingPolicyCount}>
              {count}/{BOOKING_POLICY_MAX_LENGTH}
            </AppText>
          </View>
        ) : null}
      </SurfaceCard>
    </View>
  );
}
