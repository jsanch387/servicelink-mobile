import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, InlineCardError, WizardStepHeader } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { isValidCalendarYyyyMmDd } from '../utils/formatScheduledDateDisplay';
import { CreateQuoteSendSuccess } from '../components/create-quote/CreateQuoteSendSuccess';
import { CreateQuoteStepContent } from '../components/create-quote/CreateQuoteStepContent';
import { CreateQuoteWizardFooter } from '../components/create-quote/CreateQuoteWizardFooter';
import {
  CREATE_QUOTE_WIZARD_STEPS,
  CREATE_QUOTE_WIZARD_STEP_COUNT,
} from '../constants/createQuoteWizard';
import { postSendExistingQuote, postSendNewQuote } from '../api/sendQuote';
import { quoteDetailQueryKey, quotesListQueryKey } from '../queryKeys';
import { canAdvanceCreateQuoteStep } from '../utils/createQuoteStepGuards';
import {
  dbTimeToCreateQuoteTime12hSnapped,
  twelveHourDisplayToHhMm,
  validateSendQuotePayload,
} from '../utils/validateSendQuotePayload';

/**
 * Path A: new quote — `POST /api/quotes/send`.
 * Path B: existing request/draft — `POST /api/quotes/[id]/send` when `quoteRequestId` is set.
 *
 * Params (from quote request): `quoteRequestId`, `customerName`, `customerEmail`, `customerPhone`,
 * `vehicleYear`, `vehicleMake`, `vehicleModel`, `serviceName`, `customerRequestNotes` (read-only on
 * review), `scheduledDateYyyyMmDd`, `scheduledStartTime12h`. Cold start from Home omits params.
 */
export function CreateQuoteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;

  const quoteRequestIdRaw = route.params?.quoteRequestId;
  const quoteRequestId =
    quoteRequestIdRaw === undefined || quoteRequestIdRaw === null
      ? undefined
      : String(quoteRequestIdRaw).trim() || undefined;

  const prefName = String(route.params?.customerName ?? '').trim();
  const prefEmail = String(route.params?.customerEmail ?? '').trim();
  const prefPhone = String(route.params?.customerPhone ?? '').trim();
  const prefVehicleYear = String(route.params?.vehicleYear ?? '').trim();
  const prefVehicleMake = String(route.params?.vehicleMake ?? '').trim();
  const prefVehicleModel = String(route.params?.vehicleModel ?? '').trim();
  const prefServiceName = String(route.params?.serviceName ?? '').trim();
  const customerRequestNotes = String(
    route.params?.customerRequestNotes ?? route.params?.requestNote ?? '',
  ).trim();
  const prefScheduledDate = String(route.params?.scheduledDateYyyyMmDd ?? '').trim();
  const prefScheduledTimeRaw = String(route.params?.scheduledStartTime12h ?? '').trim();
  const prefScheduledTime =
    prefScheduledTimeRaw && twelveHourDisplayToHhMm(prefScheduledTimeRaw)
      ? prefScheduledTimeRaw
      : dbTimeToCreateQuoteTime12hSnapped(prefScheduledTimeRaw);

  const [stepIndex, setStepIndex] = useState(0);
  const [customerName, setCustomerName] = useState(() => prefName || '');
  const [customerEmail, setCustomerEmail] = useState(() => prefEmail || '');
  const [customerPhoneDisplay, setCustomerPhoneDisplay] = useState(() =>
    prefPhone ? formatPhoneForDisplay(prefPhone) || prefPhone : '',
  );
  const [vehicleYear, setVehicleYear] = useState(() => prefVehicleYear || '');
  const [vehicleMake, setVehicleMake] = useState(() => prefVehicleMake || '');
  const [vehicleModel, setVehicleModel] = useState(() => prefVehicleModel || '');
  const [serviceName, setServiceName] = useState(() => prefServiceName || '');
  const [priceUsdText, setPriceUsdText] = useState('');
  const [durationHhMm, setDurationHhMm] = useState('01:00');
  const [businessNote, setBusinessNote] = useState('');
  const [scheduledDateYyyyMmDd, setScheduledDateYyyyMmDd] = useState(() =>
    prefScheduledDate && isValidCalendarYyyyMmDd(prefScheduledDate)
      ? prefScheduledDate
      : localYyyyMmDd(),
  );
  const [scheduledStartTime12h, setScheduledStartTime12h] = useState(() =>
    prefScheduledTime && twelveHourDisplayToHhMm(prefScheduledTime) ? prefScheduledTime : '9:00 AM',
  );

  const [sendError, setSendError] = useState(/** @type {string | null} */ (null));
  const [sending, setSending] = useState(false);
  const [sendSucceeded, setSendSucceeded] = useState(false);

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

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const businessSlug = String(business?.business_slug ?? '').trim();

  const lastStepIndex = CREATE_QUOTE_WIZARD_STEP_COUNT - 1;
  const stepDef = CREATE_QUOTE_WIZARD_STEPS[stepIndex] ?? CREATE_QUOTE_WIZARD_STEPS[0];

  const formSnapshot = useMemo(
    () => ({
      customerName,
      customerEmail,
      customerPhoneDisplay,
      serviceName,
      priceUsdText,
      durationHhMm,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
    }),
    [
      customerEmail,
      customerName,
      customerPhoneDisplay,
      durationHhMm,
      priceUsdText,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
      serviceName,
    ],
  );

  const canContinue = canAdvanceCreateQuoteStep(stepIndex, formSnapshot);

  const formBag = useMemo(
    () => ({
      customerName,
      setCustomerName,
      customerEmail,
      setCustomerEmail,
      customerPhoneDisplay,
      setCustomerPhoneDisplay,
      vehicleYear,
      setVehicleYear,
      vehicleMake,
      setVehicleMake,
      vehicleModel,
      setVehicleModel,
      serviceName,
      setServiceName,
      priceUsdText,
      setPriceUsdText,
      durationHhMm,
      setDurationHhMm,
      scheduledDateYyyyMmDd,
      setScheduledDateYyyyMmDd,
      scheduledStartTime12h,
      setScheduledStartTime12h,
      businessNote,
      setBusinessNote,
      customerRequestNotes,
    }),
    [
      customerEmail,
      customerName,
      customerPhoneDisplay,
      durationHhMm,
      businessNote,
      customerRequestNotes,
      priceUsdText,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
      serviceName,
      vehicleMake,
      vehicleModel,
      vehicleYear,
    ],
  );

  const isReviewStep = stepIndex === lastStepIndex;

  useLayoutEffect(() => {
    if (sendSucceeded) {
      navigation.setOptions({ title: 'Quote sent' });
    } else if (isReviewStep) {
      navigation.setOptions({ title: 'Review' });
    } else {
      navigation.setOptions({
        title: quoteRequestId ? 'Send quote' : 'New quote',
      });
    }
  }, [isReviewStep, navigation, quoteRequestId, sendSucceeded]);

  const handleSuccessDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSend = useCallback(async () => {
    setSendError(null);
    setSendSucceeded(false);
    if (!accessToken) {
      setSendError('Sign in to send quotes.');
      return;
    }
    if (!businessSlug) {
      setSendError('Your public business slug is missing. Add it on the web app, then try again.');
      return;
    }

    const validated = validateSendQuotePayload({
      businessSlug,
      customerName,
      customerEmail,
      customerPhoneDisplay,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      serviceName,
      priceUsdText,
      durationHhMm,
      note: businessNote,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
    });

    if (!validated.ok) {
      setSendError(validated.message);
      return;
    }

    setSending(true);
    try {
      const result = quoteRequestId
        ? await postSendExistingQuote(accessToken, quoteRequestId, validated.body)
        : await postSendNewQuote(accessToken, validated.body);

      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setSendError(
          safeUserFacingMessage(result.error, {
            fallback: 'Could not send quote. Please try again.',
          }),
        );
        return;
      }

      if (businessId) {
        await queryClient.invalidateQueries({ queryKey: quotesListQueryKey(businessId) });
        if (quoteRequestId) {
          await queryClient.invalidateQueries({
            queryKey: quoteDetailQueryKey(businessId, quoteRequestId),
          });
        }
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSendSucceeded(true);
    } finally {
      setSending(false);
    }
  }, [
    accessToken,
    businessId,
    businessSlug,
    customerEmail,
    customerName,
    customerPhoneDisplay,
    durationHhMm,
    businessNote,
    priceUsdText,
    queryClient,
    quoteRequestId,
    scheduledDateYyyyMmDd,
    scheduledStartTime12h,
    serviceName,
    vehicleMake,
    vehicleModel,
    vehicleYear,
  ]);

  const handleFooterBack = useCallback(() => {
    setSendError(null);
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((s) => Math.max(0, s - 1));
  }, [navigation, stepIndex]);

  const handleFooterContinue = useCallback(() => {
    setSendError(null);
    if (stepIndex >= lastStepIndex) {
      void handleSend();
      return;
    }
    void Haptics.selectionAsync().catch(() => {});
    setStepIndex((s) => Math.min(lastStepIndex, s + 1));
  }, [handleSend, lastStepIndex, stepIndex]);

  const sendButtonTitle = 'Send quote';

  const businessLoadRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void businessQ.refetch()}
        refreshing={Boolean(businessQ.isFetching && !businessQ.isLoading)}
        tintColor={colors.accent}
      />
    ),
    [businessQ, colors.accent],
  );

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
        scroll: {
          flex: 1,
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
        contentSuccessConfirm: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 40,
          paddingTop: 32,
          width: '100%',
        },
        loadingBox: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        businessErrorRetry: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  if (businessQ.isLoading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.loadingBox}
          refreshControl={businessLoadRefreshControl}
          style={styles.scroll}
        >
          <ActivityIndicator color={colors.textMuted} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (businessQ.isError) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={businessLoadRefreshControl}
          style={styles.scroll}
        >
          <InlineCardError message={businessQ.error?.message ?? 'Could not load your business.'} />
          <Button
            accessibilityHint="Attempts to load your business again"
            accessibilityLabel="Try again"
            fullWidth
            loading={Boolean(businessQ.isFetching && !businessQ.isLoading)}
            style={styles.businessErrorRetry}
            title="Try again"
            variant="secondary"
            onPress={() => void businessQ.refetch()}
          />
        </ScrollView>
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
          {!isReviewStep ? (
            <WizardStepHeader
              progressAccessibilityLabel="Quote wizard progress"
              stepCount={CREATE_QUOTE_WIZARD_STEP_COUNT}
              stepIndex={stepIndex}
              subtitle={stepDef.subtitle}
              title={stepDef.title}
            />
          ) : null}

          <View style={styles.scrollOuter}>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                isReviewStep && !sendSucceeded && styles.contentReview,
                sendSucceeded && styles.contentSuccessConfirm,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              {sendError && !sendSucceeded ? <InlineCardError message={sendError} /> : null}
              {!businessSlug ? (
                <InlineCardError message="Your business slug is not set. Finish your booking profile on the web app, then return here." />
              ) : null}

              {sendSucceeded ? (
                <CreateQuoteSendSuccess customerEmail={customerEmail} />
              ) : (
                <CreateQuoteStepContent form={formBag} stepIndex={stepIndex} />
              )}
            </ScrollView>
          </View>

          <CreateQuoteWizardFooter
            canContinue={canContinue}
            disabled={!businessSlug || !accessToken}
            lastStepIndex={lastStepIndex}
            paddingBottom={12 + insets.bottom}
            sendButtonTitle={sendButtonTitle}
            sendSuccessMode={sendSucceeded}
            sending={sending}
            stepIndex={stepIndex}
            onBack={handleFooterBack}
            onContinue={handleFooterContinue}
            onSuccessDone={handleSuccessDone}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
