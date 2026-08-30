import { Pressable, View } from 'react-native';
import { AppText } from '../../../../components/ui';

/**
 * Compact mobile-coverage row for Booking → Both (shop fields stay full).
 */
export function BookingLinkEditMobileAreaSummary({ coverageLabel, errorText, styles, onEdit }) {
  return (
    <Pressable
      accessibilityHint="Opens Mobile to edit your service area"
      accessibilityLabel="Edit mobile area"
      accessibilityRole="button"
      onPress={onEdit}
    >
      {({ pressed }) => (
        <View style={[styles.bookingMobileSummary, pressed && styles.bookingMobileSummaryPressed]}>
          <View style={styles.bookingMobileSummaryHeader}>
            <View style={styles.bookingMobileSummaryLabelCol}>
              <AppText style={styles.bookingMobileSummaryLabel}>Mobile area</AppText>
            </View>
            <View style={styles.bookingMobileSummaryEditCol}>
              <AppText style={styles.bookingMobileSummaryEdit}>Edit</AppText>
            </View>
          </View>
          <AppText style={styles.bookingMobileSummaryValue}>
            {coverageLabel || 'Add a service area'}
          </AppText>
          {errorText ? (
            <AppText style={styles.bookingMobileSummaryError}>{errorText}</AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
