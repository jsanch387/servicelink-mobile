import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WizardStepHeader } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useServicesCatalog } from '../../services/hooks/useServicesCatalog';
import { CreateAppointmentStepContent } from './components/CreateAppointmentStepContent';
import { CreateAppointmentSubmittingState } from './components/CreateAppointmentSubmittingState';
import { CreateFlowFooter } from './components/CreateFlowFooter';
import { useCreateAppointmentController } from './hooks/useCreateAppointmentController';

/**
 * Owner manual booking wizard: service → pricing → add-ons → schedule → customer → location → address → vehicle → review.
 * Confirming a booking calls the Next.js `POST /api/public/bookings` pipeline (emails, payments row, caps) — see
 * `create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md`.
 * State and side effects live in {@link useCreateAppointmentController}.
 *
 * @param {{ onImmersiveSubmitChange?: (hideNavigationHeader: boolean) => void }} props
 */
export function CreateAppointmentFlow({ onImmersiveSubmitChange }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, session } = useAuth();
  const catalog = useServicesCatalog();

  const flow = useCreateAppointmentController({
    catalog,
    userId: user?.id,
    accessToken: session?.access_token,
    navigation,
  });

  const hideNavigationHeader = flow.showSubmitPanel || flow.appointmentConfirmed;

  useLayoutEffect(() => {
    onImmersiveSubmitChange?.(hideNavigationHeader);
  }, [hideNavigationHeader, onImmersiveSubmitChange]);

  const wizardHeaderProps = flow.wizardHeader
    ? {
        progressAccessibilityLabel: 'Appointment wizard progress',
        stepCount: flow.wizardHeader.stepCount,
        stepIndex: flow.wizardHeader.stepIndex,
        subtitle: flow.wizardHeader.subtitle,
        title: flow.wizardHeader.title,
      }
    : null;

  const showWizardHeader = Boolean(wizardHeaderProps && !flow.showSubmitPanel);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={flow.styles.flex}
      >
        {showWizardHeader && !flow.wizardHeader.scrollWithContent ? (
          <WizardStepHeader {...wizardHeaderProps} />
        ) : null}
        <ScrollView
          contentContainerStyle={[
            flow.styles.content,
            flow.appointmentConfirmed && flow.styles.contentConfirmed,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={flow.styles.scroll}
        >
          {showWizardHeader && flow.wizardHeader.scrollWithContent ? (
            <WizardStepHeader embedded {...wizardHeaderProps} />
          ) : null}
          <CreateAppointmentStepContent {...flow.stepContentProps} />
        </ScrollView>
        {!flow.showSubmitPanel ? (
          <CreateFlowFooter {...flow.footer} paddingBottom={12 + insets.bottom} />
        ) : null}
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={flow.showSubmitPanel}
        onRequestClose={() => {}}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={{ backgroundColor: colors.shell, flex: 1 }}
        >
          <CreateAppointmentSubmittingState
            active={flow.submitPanel.active}
            error={flow.submitPanel.error}
            hasCustomerPhone={flow.submitPanel.hasCustomerPhone}
            immersive
            onRetryFromError={flow.submitPanel.onRetry}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
