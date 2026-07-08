import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SuccessMoment } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from '../constants/markCompleteFeatureFlags';

const PENDING_MESSAGES_WITH_REVIEW = [
  'Completing',
  'Sending receipt',
  'Sending review link',
  'Updating booking',
];
const PENDING_MESSAGES_RECEIPT_ONLY = ['Completing', 'Sending receipt', 'Updating booking'];
const PENDING_MESSAGES_NEUTRAL = ['Completing', 'Updating booking'];
const PENDING_MESSAGE_MS = 1200;

/**
 * @param {boolean | undefined} includesReviewLink
 * @returns {string[]}
 */
function getPendingMessages(includesReviewLink) {
  if (!COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY) {
    return PENDING_MESSAGES_NEUTRAL;
  }
  if (includesReviewLink === false) {
    return PENDING_MESSAGES_RECEIPT_ONLY;
  }
  return PENDING_MESSAGES_WITH_REVIEW;
}

/**
 * Full-screen pending / success overlay for the complete-visit flow.
 *
 * @param {{
 *   phase: 'pending' | 'success';
 *   pendingTitle?: string;
 *   successTitle: string;
 *   successDetail: string;
 *   includesReviewLink?: boolean;
 *   bottomInset?: number;
 * }} props
 */
export function CompleteVisitSubmitOverlay({
  phase,
  pendingTitle = 'Completing',
  successTitle,
  successDetail,
  includesReviewLink,
  bottomInset = 0,
}) {
  const { colors } = useTheme();
  const pendingMessages = getPendingMessages(includesReviewLink);
  const [pendingMessageIndex, setPendingMessageIndex] = useState(0);

  useEffect(() => {
    if (phase !== 'pending') {
      setPendingMessageIndex(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setPendingMessageIndex((prev) => (prev + 1) % pendingMessages.length);
    }, PENDING_MESSAGE_MS);

    return () => clearInterval(intervalId);
  }, [phase, pendingMessages.length]);

  const overlayInsetStyle = { paddingBottom: bottomInset };

  if (phase === 'pending') {
    const activePendingTitle = pendingMessages[pendingMessageIndex] ?? pendingTitle;
    return (
      <View style={[styles.root, overlayInsetStyle, { backgroundColor: colors.shell }]}>
        <View style={styles.centeredWrap}>
          <EchoBarsLoader accessibilityLabel="Completing" />
          <AppText style={[styles.pendingTitle, { color: colors.text }]}>
            {activePendingTitle}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, overlayInsetStyle, { backgroundColor: colors.shell }]}>
      <SuccessMoment
        body={successDetail}
        centered
        iconAccessibilityLabel="Visit completed"
        playHaptic={false}
        title={successTitle}
        variant="inline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  centeredWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
});
