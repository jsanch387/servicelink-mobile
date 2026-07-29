import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, InlineCardError, WizardStepHeader } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useAuth } from '../../auth';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { useServicesCatalog } from '../../services/hooks/useServicesCatalog';
import { CreateAppointmentStepContent } from '../create-appointment/components/CreateAppointmentStepContent';
import { CreateFlowFooter } from '../create-appointment/components/CreateFlowFooter';
import { EditAppointmentHub } from './components/EditAppointmentHub';
import { EditAppointmentHubSkeleton } from './components/EditAppointmentHubSkeleton';
import { EditAppointmentJobsList } from './components/EditAppointmentJobsList';
import { EditAppointmentNotesStep } from './components/EditAppointmentNotesStep';
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
    () => [
      flow.styles.content,
      flow.isHubView || flow.isJobsListView || flow.isJobHubView
        ? localStyles.scrollHub
        : localStyles.scrollSection,
    ],
    [
      flow.isHubView,
      flow.isJobsListView,
      flow.isJobHubView,
      flow.styles.content,
      localStyles.scrollHub,
      localStyles.scrollSection,
    ],
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

  const sectionHeader =
    flow.showMainTitle && flow.mainTitle ? (
      <WizardStepHeader
        embedded
        showProgress={false}
        stepCount={1}
        stepIndex={0}
        subtitle={flow.mainSubtitle}
        title={flow.mainTitle}
      />
    ) : null;

  let body = null;
  if (flow.isHubView) {
    body = <EditAppointmentHub sections={flow.hubSections} onOpenSection={flow.openEditSection} />;
  } else if (flow.isJobsListView) {
    body = <EditAppointmentJobsList jobs={flow.jobs} onSelectJob={flow.openJobForEdit} />;
  } else if (flow.isJobHubView) {
    body = (
      <EditAppointmentHub
        heading="Edit job"
        sections={flow.jobHubSections}
        subtext="Change this job’s service, price, add-ons, or vehicle."
        onOpenSection={flow.openEditSection}
      />
    );
  } else if (flow.isNotesView) {
    body = (
      <>
        {sectionHeader}
        <EditAppointmentNotesStep notes={flow.notes} onChangeNotes={flow.onChangeNotes} />
      </>
    );
  } else {
    body = (
      <>
        {sectionHeader}
        <CreateAppointmentStepContent {...flow.stepContentProps} />
      </>
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
        {body}
      </ScrollView>
      <CreateFlowFooter {...flow.footer} paddingBottom={12 + insets.bottom} />
    </KeyboardAvoidingView>
  );
}
