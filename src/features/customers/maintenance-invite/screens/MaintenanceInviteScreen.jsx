import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppText, Button } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { ROUTES } from '../../../../routes/routes';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import { useTheme } from '../../../../theme';
import { useAuth } from '../../../auth';
import { fetchBusinessProfileForUser } from '../../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../../home/queryKeys';
import { MAINTENANCE_QUERY_ROOT } from '../../../maintenance/queryKeys';
import { customerDetailsQueryKey, customersListQueryKey } from '../../queryKeys';
import { CreateQuoteWizardFooter } from '../../../quotes/components/create-quote/CreateQuoteWizardFooter';
import { postMaintenanceEnrollment } from '../api/postMaintenanceEnrollment';
import {
  MAINTENANCE_DEFAULT_DURATION_HH_MM,
  MAINTENANCE_DEFAULT_PREFERRED_TIME,
  MAINTENANCE_INVITE_WIZARD_STEP_COUNT,
  MAINTENANCE_INVITE_WIZARD_STEPS,
} from '../constants';
import { MAINTENANCE_INVITE_SEND_MIN_PENDING_MS } from '../constants/sendPhase';
import { MaintenanceInviteSendOutcome } from '../components/MaintenanceInviteSendOutcome';
import { MaintenanceInviteStepContent } from '../components/MaintenanceInviteStepContent';
import { MaintenanceInviteWizardHeader } from '../components/MaintenanceInviteWizardHeader';
import { buildMaintenanceInvitePayload } from '../utils/buildMaintenanceInvitePayload';
import { canAdvanceMaintenanceInviteStep } from '../utils/maintenanceInviteStepGuards';

const SEND_ERROR_FALLBACK = 'Something went wrong sending the offer. Please try again.';

export function MaintenanceInviteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token ?? null;

  const customerId = String(route.params?.customerId ?? '').trim();
  const customerName = String(route.params?.customerName ?? '').trim() || 'Customer';
  const customerEmail = String(route.params?.customerEmail ?? '').trim();

  const [stepIndex, setStepIndex] = useState(0);
  const [priceUsdText, setPriceUsdText] = useState('');
  const [durationHhMm, setDurationHhMm] = useState(MAINTENANCE_DEFAULT_DURATION_HH_MM);
  const [preferredDateYyyyMmDd, setPreferredDateYyyyMmDd] = useState('');
  const [preferredTime12h, setPreferredTime12h] = useState(MAINTENANCE_DEFAULT_PREFERRED_TIME);
  const [submitError, setSubmitError] = useState('');
  const [sendResult, setSendResult] = useState(
    /** @type {{ customerViewUrl: string; emailSent: boolean; notifiedEmail?: string; emailError?: string; enrollmentId: string } | null} */ (
      null
    ),
  );
  const [sendPhase, setSendPhase] = useState(
    /** @type {'wizard' | 'pending' | 'success' | 'error'} */ ('wizard'),
  );

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const businessSlug = String(businessQ.data?.business_slug ?? '').trim();

  const lastStepIndex = MAINTENANCE_INVITE_WIZARD_STEP_COUNT - 1;
  const stepDef = MAINTENANCE_INVITE_WIZARD_STEPS[stepIndex] ?? MAINTENANCE_INVITE_WIZARD_STEPS[0];
  const isReviewStep = stepIndex === lastStepIndex;
  const showingOutcome = sendPhase !== 'wizard';

  const formSnapshot = useMemo(
    () => ({
      priceUsdText,
      durationHhMm,
    }),
    [durationHhMm, priceUsdText],
  );

  const canContinue = canAdvanceMaintenanceInviteStep(stepIndex, formSnapshot);

  const formBag = useMemo(
    () => ({
      customerName,
      customerEmail,
      priceUsdText,
      setPriceUsdText,
      durationHhMm,
      setDurationHhMm,
      preferredDateYyyyMmDd,
      setPreferredDateYyyyMmDd,
      preferredTime12h,
      setPreferredTime12h,
    }),
    [
      customerEmail,
      customerName,
      durationHhMm,
      preferredDateYyyyMmDd,
      preferredTime12h,
      priceUsdText,
    ],
  );

  useLayoutEffect(() => {
    if (sendPhase === 'pending') {
      navigation.setOptions({ title: 'Sending offer' });
      return;
    }
    if (sendPhase === 'success') {
      navigation.setOptions({ title: 'Offer sent' });
      return;
    }
    if (sendPhase === 'error') {
      navigation.setOptions({ title: 'Couldn’t send' });
      return;
    }
    if (isReviewStep) {
      navigation.setOptions({ title: 'Review offer' });
      return;
    }
    navigation.setOptions({ title: 'Maintenance offer' });
  }, [isReviewStep, navigation, sendPhase]);

  const handleSendInvite = useCallback(async () => {
    Keyboard.dismiss();
    setSubmitError('');
    setSendResult(null);

    if (!accessToken) {
      setSubmitError('Sign in to send maintenance offers.');
      return;
    }

    const payload = buildMaintenanceInvitePayload({
      businessId: businessId ?? '',
      businessSlug,
      customerId,
      priceUsdText,
      durationHhMm,
      preferredDateYyyyMmDd,
      preferredTime12h,
    });

    if (!payload.ok) {
      setSubmitError(payload.message);
      return;
    }

    setSendPhase('pending');

    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, MAINTENANCE_INVITE_SEND_MIN_PENDING_MS);
    });

    try {
      const [result] = await Promise.all([
        postMaintenanceEnrollment(accessToken, payload.body),
        pendingMin,
      ]);

      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setSubmitError(safeUserFacingMessage(result.error, { fallback: SEND_ERROR_FALLBACK }));
        setSendPhase('error');
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSendResult({
        enrollmentId: result.data.id,
        customerViewUrl: result.data.customerViewUrl,
        emailSent: result.data.emailSent,
        notifiedEmail: result.data.notifiedEmail,
        emailError: result.data.emailError,
      });
      setSendPhase('success');

      if (businessId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: customersListQueryKey(businessId) }),
          queryClient.invalidateQueries({
            queryKey: customerDetailsQueryKey(businessId, customerId),
          }),
          queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_ROOT }),
        ]);
      }
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setSubmitError(SEND_ERROR_FALLBACK);
      setSendPhase('error');
    }
  }, [
    accessToken,
    businessId,
    businessSlug,
    customerId,
    durationHhMm,
    preferredDateYyyyMmDd,
    preferredTime12h,
    priceUsdText,
    queryClient,
  ]);

  const handleFooterBack = useCallback(() => {
    setSubmitError('');
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((s) => Math.max(0, s - 1));
  }, [navigation, stepIndex]);

  const handleFooterContinue = useCallback(() => {
    setSubmitError('');
    if (stepIndex >= lastStepIndex) {
      void handleSendInvite();
      return;
    }
    void Haptics.selectionAsync().catch(() => {});
    setStepIndex((s) => Math.min(lastStepIndex, s + 1));
  }, [handleSendInvite, lastStepIndex, stepIndex]);

  const handleDone = useCallback(() => {
    const enrollmentId = sendResult?.enrollmentId;
    setSendPhase('wizard');
    setSendResult(null);
    if (enrollmentId && customerId) {
      navigation.navigate(ROUTES.MORE, {
        screen: ROUTES.MAINTENANCE_DETAIL,
        params: { customerId, enrollmentId },
      });
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [customerId, navigation, sendResult?.enrollmentId]);

  const handleRetryFromError = useCallback(() => {
    setSubmitError('');
    setSendPhase('wizard');
    setStepIndex(lastStepIndex);
  }, [lastStepIndex]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        column: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        scrollOuter: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 6,
        },
        contentReview: {
          gap: 12,
          paddingBottom: 36,
          paddingTop: 22,
        },
        contentOutcome: {
          flexGrow: 1,
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        fallback: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  if (!customerId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
          <AppText style={styles.fallback}>
            This screen needs a valid customer. Open the customer from your list and try again.
          </AppText>
          <Button
            fullWidth
            style={{ marginTop: 16 }}
            title="Go back"
            variant="primary"
            onPress={handleDone}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.column}>
          {!showingOutcome && !isReviewStep ? (
            <MaintenanceInviteWizardHeader
              stepCount={MAINTENANCE_INVITE_WIZARD_STEP_COUNT}
              stepIndex={stepIndex}
              subtitle={stepDef.subtitle}
              title={stepDef.title}
            />
          ) : null}

          <View style={styles.scrollOuter}>
            <ScrollView
              contentContainerStyle={
                showingOutcome
                  ? styles.contentOutcome
                  : [styles.content, isReviewStep && styles.contentReview]
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              {showingOutcome ? (
                <MaintenanceInviteSendOutcome
                  customerViewUrl={sendResult?.customerViewUrl ?? ''}
                  emailError={sendResult?.emailError}
                  emailSent={Boolean(sendResult?.emailSent)}
                  errorMessage={submitError || SEND_ERROR_FALLBACK}
                  notifiedEmail={sendResult?.notifiedEmail}
                  phase={sendPhase}
                  onDone={handleDone}
                  onTryAgain={handleRetryFromError}
                />
              ) : (
                <MaintenanceInviteStepContent form={formBag} stepIndex={stepIndex} />
              )}
            </ScrollView>
          </View>

          {!showingOutcome ? (
            <CreateQuoteWizardFooter
              canContinue={canContinue && Boolean(businessSlug) && Boolean(accessToken)}
              lastStepIndex={lastStepIndex}
              paddingBottom={12 + insets.bottom}
              sendButtonTitle="Send offer"
              sending={sendPhase === 'pending'}
              stepIndex={stepIndex}
              onBack={handleFooterBack}
              onContinue={handleFooterContinue}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
