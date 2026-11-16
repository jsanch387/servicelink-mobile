import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SuccessMoment } from '../../../../components/ui';
import { SUBMIT_OUTCOME_ERROR } from '../../../../components/ui/submitOutcomeTokens';
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
 * Full-screen pending / success / error overlay for the complete-visit flow.
 *
 * @param {{
 *   phase: 'pending' | 'success' | 'error';
 *   pendingTitle?: string;
 *   successTitle: string;
 *   successDetail: string;
 *   errorTitle?: string;
 *   errorDetail?: string;
 *   includesReviewLink?: boolean;
 *   bottomInset?: number;
 * }} props
 */
export function CompleteVisitSubmitOverlay({
  phase,
  pendingTitle = 'Completing',
  successTitle,
  successDetail,
  errorTitle = 'Could not complete',
  errorDetail = '',
  includesReviewLink,
  bottomInset = 0,
}) {
  const { colors } = useTheme();
  const pendingMessages = getPendingMessages(includesReviewLink);
  const pendingMessage = useCyclingStatusMessage(phase === 'pending', pendingMessages);

  const overlayInsetStyle = { paddingBottom: bottomInset };

  if (phase === 'error') {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={[
          StyleSheet.absoluteFill,
          styles.root,
          overlayInsetStyle,
          { backgroundColor: colors.shell },
        ]}
      >
        <View style={styles.centeredWrap}>
          <View
            accessibilityLabel="Could not complete visit"
            accessibilityRole="image"
            style={[styles.errorIconRing, { backgroundColor: SUBMIT_OUTCOME_ERROR.ring }]}
          >
            <Ionicons color={SUBMIT_OUTCOME_ERROR.color} name="alert-circle" size={72} />
          </View>
          <AppText style={[styles.errorTitle, { color: colors.text }]}>{errorTitle}</AppText>
          {errorDetail ? (
            <AppText style={[styles.errorDetail, { color: colors.textMuted }]}>
              {errorDetail}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }

  if (phase === 'pending') {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={[
          StyleSheet.absoluteFill,
          styles.root,
          overlayInsetStyle,
          { backgroundColor: colors.shell },
        ]}
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
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        overlayInsetStyle,
        { backgroundColor: colors.shell },
      ]}
    >
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
  errorIconRing: {
    alignItems: 'center',
    borderRadius: 999,
    height: 104,
    justifyContent: 'center',
    marginBottom: 8,
    width: 104,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
});
