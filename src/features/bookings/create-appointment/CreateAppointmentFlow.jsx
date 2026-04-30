import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/ui';
import { useAuth } from '../../auth';
import { useServicesCatalog } from '../../services/hooks/useServicesCatalog';
import { CreateAppointmentStepContent } from './components/CreateAppointmentStepContent';
import { CreateFlowFooter } from './components/CreateFlowFooter';
import { CreateFlowProgressBar } from './components/CreateFlowProgressBar';
import { useCreateAppointmentController } from './hooks/useCreateAppointmentController';

/**
 * Owner manual booking wizard: service → pricing → add-ons → schedule → customer → address → vehicle → review.
 * State and side effects live in {@link useCreateAppointmentController}.
 */
export function CreateAppointmentFlow() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const catalog = useServicesCatalog();

  const flow = useCreateAppointmentController({
    catalog,
    userId: user?.id,
    navigation,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={flow.styles.flex}
    >
      <CreateFlowProgressBar progressPercent={flow.progressPercent} />
      <ScrollView
        contentContainerStyle={flow.styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={flow.styles.scroll}
      >
        {flow.showMainTitle ? <AppText style={flow.styles.title}>{flow.mainTitle}</AppText> : null}
        <CreateAppointmentStepContent {...flow.stepContentProps} />
      </ScrollView>

      <CreateFlowFooter {...flow.footer} paddingBottom={12 + insets.bottom} />
    </KeyboardAvoidingView>
  );
}
