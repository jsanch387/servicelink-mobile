import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
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
 * Owner manual booking wizard: catalog service or custom job → optional pricing/add-ons →
 * location → address → vehicle (optional add-another job) → schedule → customer → review.
 * Confirming calls `POST /api/public/bookings` once with appointment fields + `jobs[]`.
 * State and side effects live in {@link useCreateAppointmentController}.
 *
 * @param {{
 *   onImmersiveSubmitChange?: (hideNavigationHeader: boolean) => void;
 *   prefilledCustomer?: {
 *     customerId?: string;
 *     fullName?: string;
 *     email?: string;
 *     phone?: string;
 *     address?: {
 *       street?: string;
 *       unit?: string;
 *       city?: string;
 *       state?: string;
 *       zip?: string;
 *     } | null;
 *   } | null;
 * }} props
 */
export function CreateAppointmentFlow({ onImmersiveSubmitChange, prefilledCustomer }) {
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
    prefilledCustomer,
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
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[
            flow.styles.content,
            flow.appointmentConfirmed && flow.styles.contentConfirmed,
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={flow.styles.scroll}
        >
          <Pressable accessible={false} onPress={Keyboard.dismiss}>
            {showWizardHeader && flow.wizardHeader.scrollWithContent ? (
              <WizardStepHeader embedded {...wizardHeaderProps} />
            ) : null}
            <CreateAppointmentStepContent {...flow.stepContentProps} />
          </Pressable>
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
            shouldNotifyCustomer={flow.submitPanel.shouldNotifyCustomer}
            immersive
            onRetryFromError={flow.submitPanel.onRetry}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
