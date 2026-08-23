import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  InlineCardError,
  SettingsSection,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { BookingActivityEventRow } from '../booking-details/components/BookingActivityEventRow';
import { BookingActivitySkeleton } from '../booking-details/components/BookingActivitySkeleton';
import { useBookingActivity } from '../booking-details/hooks/useBookingActivity';

/**
 * Customer updates for one booking. Fetches only while this screen is mounted.
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
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        errorRetry: {
          marginTop: 12,
        },
        empty: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          paddingHorizontal: 4,
          paddingTop: 8,
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
        {activity.isLoading ? <BookingActivitySkeleton /> : null}

        {activity.errorMessage && !activity.isLoading ? (
          <SurfaceCard>
            <InlineCardError message={activity.errorMessage} />
            <Button
              accessibilityHint="Attempts to load activity again"
              accessibilityLabel="Try again"
              fullWidth
              loading={activity.isFetching}
              style={styles.errorRetry}
              title="Try again"
              variant="secondary"
              onPress={() => void activity.refetch()}
            />
          </SurfaceCard>
        ) : null}

        {!activity.isLoading && !activity.errorMessage && activity.groups.length === 0 ? (
          <AppText style={styles.empty}>No updates for this appointment yet.</AppText>
        ) : null}

        {!activity.isLoading && !activity.errorMessage
          ? activity.groups.map((group, index) => (
              <SettingsSection first={index === 0} key={group.id} title={group.title}>
                <View>
                  {group.events.map((event, eventIndex) => (
                    <BookingActivityEventRow
                      key={event.key}
                      event={event}
                      showDivider={eventIndex < group.events.length - 1}
                    />
                  ))}
                </View>
              </SettingsSection>
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}
