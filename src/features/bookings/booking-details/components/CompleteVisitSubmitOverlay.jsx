import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SuccessMoment } from '../../../../components/ui';
import { useCyclingStatusMessage } from '../../../../hooks/useCyclingStatusMessage';
import { useTheme } from '../../../../theme';
import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from '../constants/markCompleteFeatureFlags';

const PENDING_MESSAGES_WITH_REVIEW = [
  'Completing appointment',
  'Saving visit details',
  'Sending receipt',
  'Sending review link',
  'Updating booking',
  'Refreshing schedule',
  'Finishing up',
];
const PENDING_MESSAGES_RECEIPT_ONLY = [
  'Completing appointment',
  'Saving visit details',
  'Sending receipt',
  'Updating booking',
  'Refreshing schedule',
  'Finishing up',
];
const PENDING_MESSAGES_NEUTRAL = [
  'Completing appointment',
  'Saving visit details',
  'Updating booking',
  'Refreshing schedule',
  'Finishing up',
];

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
  const pendingMessage = useCyclingStatusMessage(phase === 'pending', pendingMessages);

  const overlayInsetStyle = { paddingBottom: bottomInset };

  if (phase === 'pending') {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={[styles.root, overlayInsetStyle, { backgroundColor: colors.shell }]}
      >
        <View style={styles.centeredWrap}>
          <EchoBarsLoader accessibilityLabel="Completing appointment" size="large" />
          <AppText style={[styles.pendingTitle, { color: colors.textSecondary }]}>
            {pendingMessage || pendingTitle}
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
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginTop: 20,
    textAlign: 'center',
  },
});
