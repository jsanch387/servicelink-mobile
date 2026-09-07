import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError, SettingsSection } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { BookingActivityEventRow } from '../booking-details/components/BookingActivityEventRow';
import { BookingActivitySkeleton } from '../booking-details/components/BookingActivitySkeleton';
import { useBookingActivity } from '../booking-details/hooks/useBookingActivity';

/**
 * Texts and emails sent to the customer for one booking.
 */
export function BookingActivityScreen({ route }) {
  const { colors } = useTheme();
  const bookingId = route?.params?.bookingId;
  const activity = useBookingActivity(bookingId);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 12,
        },
        padded: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        errorRetry: {
          marginTop: 12,
        },
        emptyTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.25,
          lineHeight: 21,
        },
        emptyBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 4,
        },
      }),
    [colors],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void activity.refetch()}
        refreshing={Boolean(activity.isFetching && !activity.isLoading)}
        tintColor={colors.accent}
      />
    ),
    [activity, colors.accent],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {activity.isLoading ? (
          <SettingsSection first>
            <BookingActivitySkeleton />
          </SettingsSection>
        ) : null}

        {activity.errorMessage && !activity.isLoading ? (
          <SettingsSection first>
            <View style={styles.padded}>
              <InlineCardError message={activity.errorMessage} />
              <Button
                accessibilityHint="Attempts to load customer updates again"
                accessibilityLabel="Try again"
                fullWidth
                loading={activity.isFetching}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void activity.refetch()}
              />
            </View>
          </SettingsSection>
        ) : null}

        {!activity.isLoading && !activity.errorMessage && activity.events.length === 0 ? (
          <SettingsSection first>
            <View style={styles.padded}>
              <AppText style={styles.emptyTitle}>Nothing sent yet</AppText>
              <AppText style={styles.emptyBody}>
                Texts and emails about this visit show up here.
              </AppText>
            </View>
          </SettingsSection>
        ) : null}

        {!activity.isLoading && !activity.errorMessage && activity.events.length > 0 ? (
          <SettingsSection first>
            {activity.events.map((event, index) => (
              <BookingActivityEventRow
                key={event.key}
                event={event}
                isFirst={index === 0}
                isLast={index === activity.events.length - 1}
              />
            ))}
          </SettingsSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
