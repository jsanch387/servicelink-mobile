import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useAuth } from '../../auth';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { useServicesCatalog } from '../../services/hooks/useServicesCatalog';
import { CreateAppointmentStepContent } from '../create-appointment/components/CreateAppointmentStepContent';
import { CreateFlowFooter } from '../create-appointment/components/CreateFlowFooter';
import { EditAppointmentHub } from './components/EditAppointmentHub';
import { EditAppointmentHubSkeleton } from './components/EditAppointmentHubSkeleton';
import { useEditAppointmentController } from './hooks/useEditAppointmentController';

/**
 * Edit-appointment hub + section screens — jump to what you need, save from the hub.
 *
 * @param {object} props
 * @param {string | undefined} props.bookingId booking row id from route params
 */
export function EditAppointmentFlow({ bookingId }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const catalog = useServicesCatalog();
  const bookingQuery = useBookingDetails(bookingId);

  const flow = useEditAppointmentController({
    bookingId,
    booking: bookingQuery.booking,
    bookingLoading: bookingQuery.isLoading,
    bookingErrorMessage: bookingQuery.errorMessage,
    catalog,
    userId: user?.id,
    navigation,
  });

  const titleStyle = flow.styles.title;

  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        scrollHub: {
          paddingTop: 12,
        },
        scrollSection: {
          paddingTop: 18,
        },
      }),
    [],
  );

  const scrollContentStyle = useMemo(
    () => [flow.styles.content, flow.isHubView ? localStyles.scrollHub : localStyles.scrollSection],
    [flow.isHubView, flow.styles.content, localStyles.scrollHub, localStyles.scrollSection],
  );

  const loadingStyles = useMemo(
    () =>
      StyleSheet.create({
        errorWrap: {
          flex: 1,
          gap: 16,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
      }),
    [],
  );

  if (flow.bookingErrorMessage) {
    return (
      <View style={loadingStyles.errorWrap}>
        <InlineCardError message={flow.bookingErrorMessage} />
        <Button fullWidth title="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (flow.isInitializing) {
    return (
      <View style={flow.styles.flex}>
        <ScrollView
          contentContainerStyle={[flow.styles.content, localStyles.scrollHub]}
          showsVerticalScrollIndicator={false}
          style={flow.styles.scroll}
        >
          <EditAppointmentHubSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={flow.styles.flex}
    >
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={flow.styles.scroll}
      >
        {flow.isHubView ? (
          <EditAppointmentHub sections={flow.hubSections} onOpenSection={flow.openEditSection} />
        ) : (
          <>
            {flow.showMainTitle ? (
              <View style={flow.styles.stepHeader}>
                <View style={flow.styles.stepHeaderCopy}>
                  <AppText style={titleStyle}>{flow.mainTitle}</AppText>
                  {flow.mainSubtitle ? (
                    <AppText style={flow.styles.stepSubtitle}>{flow.mainSubtitle}</AppText>
                  ) : null}
                </View>
              </View>
            ) : null}
            <CreateAppointmentStepContent {...flow.stepContentProps} />
          </>
        )}
      </ScrollView>
      <CreateFlowFooter {...flow.footer} paddingBottom={12 + insets.bottom} />
    </KeyboardAvoidingView>
  );
}
