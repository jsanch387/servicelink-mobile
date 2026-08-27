import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../theme';
import { fireLightImpactHaptic } from '../../../utils/feedbackHaptics';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { useTapToPayConnectReadiness } from '../../tap-to-pay/hooks/useTapToPayConnectReadiness';
import { useTapToPayReaderPrewarm } from '../../tap-to-pay/hooks/useTapToPayReaderPrewarm';
import { CREATE_PAYMENT_STEP } from './constants';
import { useCreatePaymentCharge } from './hooks/useCreatePaymentCharge';
import { useCreatePaymentLink } from './hooks/useCreatePaymentLink';
import { CreatePaymentChooseStep } from './steps/CreatePaymentChooseStep';
import { CreatePaymentCollectStep } from './steps/CreatePaymentCollectStep';
import { CreatePaymentPaidStep } from './steps/CreatePaymentPaidStep';
import { CreatePaymentLinkFormStep } from './steps/CreatePaymentLinkFormStep';
import { CreatePaymentLinkReadyStep } from './steps/CreatePaymentLinkReadyStep';
import { parseCreatePaymentAmount } from './utils/createPaymentAmount';

/**
 * Home FAB create-payment: choose path → collect (Tap to Pay) or send a link.
 *
 * @param {{
 *   onClose: () => void;
 *   onHeaderLeadingChange: (next: { label: string; accessibilityLabel: string; onPress: () => void }) => void;
 * }} props
 */
export function CreatePaymentFlow({ onClose, onHeaderLeadingChange }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session, user } = useAuth();
  const [step, setStep] = useState(CREATE_PAYMENT_STEP.CHOOSE);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const footerPadding = Math.max(insets.bottom, 12);
  const parsedAmount = parseCreatePaymentAmount(amount);
  const { charge, previewPaid, charging, phase, error, readerWasWarmAtStart } =
    useCreatePaymentCharge({
      accessToken: session?.access_token,
      amount,
      note,
      onSuccess: () => setStep(CREATE_PAYMENT_STEP.COLLECT_PAID),
    });
  const { merchantDisplayName, stripeAccountId, terminalLocationId } =
    useTapToPayConnectReadiness();
  useTapToPayReaderPrewarm({
    enabled: step === CREATE_PAYMENT_STEP.COLLECT,
    connectParams: { terminalLocationId, stripeAccountId },
    merchantDisplayName,
    reason: 'walkup_form_prewarm',
  });
  const { createLink, creating } = useCreatePaymentLink({
    accessToken: session?.access_token,
    amount,
    note,
  });

  const { data: businessProfile } = useQuery({
    queryKey: homeBusinessProfileQueryKey(user?.id),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(user.id);
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: Boolean(user?.id),
  });
  const businessName = String(businessProfile?.business_name ?? '').trim();

  const goChoose = useCallback(() => {
    setStep(CREATE_PAYMENT_STEP.CHOOSE);
  }, []);

  useEffect(() => {
    if (step === CREATE_PAYMENT_STEP.CHOOSE) {
      onHeaderLeadingChange({
        label: 'Cancel',
        accessibilityLabel: 'Cancel new payment',
        onPress: onClose,
      });
      return;
    }
    if (step === CREATE_PAYMENT_STEP.LINK_READY) {
      onHeaderLeadingChange({
        label: 'Done',
        accessibilityLabel: 'Done with payment link',
        onPress: onClose,
      });
      return;
    }
    if (step === CREATE_PAYMENT_STEP.COLLECT_PAID) {
      onHeaderLeadingChange({
        label: 'Done',
        accessibilityLabel: 'Done with payment',
        onPress: onClose,
      });
      return;
    }
    onHeaderLeadingChange({
      label: 'Back',
      accessibilityLabel: 'Back',
      onPress: goChoose,
    });
  }, [goChoose, onClose, onHeaderLeadingChange, step]);

  const handleCreateLink = useCallback(async () => {
    const url = await createLink();
    if (!url) {
      return;
    }
    setLinkUrl(url);
    setCopied(false);
    setStep(CREATE_PAYMENT_STEP.LINK_READY);
  }, [createLink]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!linkUrl) {
      return;
    }
    fireLightImpactHaptic();
    await Clipboard.setStringAsync(linkUrl);
    setCopied(true);
  }, [linkUrl]);

  const handleShare = useCallback(async () => {
    if (!linkUrl) {
      return;
    }
    const what = String(note ?? '').trim();
    const message = what ? `Pay ${what}: ${linkUrl}` : `Pay here: ${linkUrl}`;
    await Share.share({ message, url: linkUrl });
  }, [linkUrl, note]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          backgroundColor: colors.shell,
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={styles.safe}
      testID="create-payment-flow"
    >
      {step === CREATE_PAYMENT_STEP.CHOOSE ? (
        <CreatePaymentChooseStep
          onChooseCollect={() => setStep(CREATE_PAYMENT_STEP.COLLECT)}
          onChooseLink={() => setStep(CREATE_PAYMENT_STEP.LINK_FORM)}
        />
      ) : null}
      {step === CREATE_PAYMENT_STEP.COLLECT ? (
        <CreatePaymentCollectStep
          amount={amount}
          chargePhase={phase}
          charging={charging}
          error={error}
          footerPadding={footerPadding}
          note={note}
          readerWasWarm={readerWasWarmAtStart}
          onAmountChange={setAmount}
          onCharge={charge}
          onPreviewPaid={previewPaid}
          onNoteChange={setNote}
        />
      ) : null}
      {step === CREATE_PAYMENT_STEP.LINK_FORM ? (
        <CreatePaymentLinkFormStep
          amount={amount}
          creating={creating}
          footerPadding={footerPadding}
          note={note}
          onAmountChange={setAmount}
          onCreateLink={handleCreateLink}
          onNoteChange={setNote}
        />
      ) : null}
      {step === CREATE_PAYMENT_STEP.COLLECT_PAID ? (
        <CreatePaymentPaidStep footerPadding={footerPadding} onDone={onClose} />
      ) : null}
      {step === CREATE_PAYMENT_STEP.LINK_READY ? (
        <CreatePaymentLinkReadyStep
          amount={parsedAmount}
          businessName={businessName}
          copied={copied}
          footerPadding={footerPadding}
          note={note}
          onCopy={handleCopy}
          onShare={handleShare}
        />
      ) : null}
    </SafeAreaView>
  );
}
