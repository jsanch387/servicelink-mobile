import { StyleSheet } from 'react-native';
import { AppText, SubmitOutcomeSuccess, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * @param {object} props
 * @param {boolean} props.emailSent
 * @param {string} [props.notifiedEmail]
 * @param {string} [props.emailError]
 * @param {string} props.customerViewUrl
 * @param {() => void} props.onDone
 */
export function MaintenanceInviteSendSuccess({
  emailSent,
  notifiedEmail,
  emailError,
  customerViewUrl,
  onDone,
}) {
  const { colors } = useTheme();
  const inbox = String(notifiedEmail ?? '').trim();
  const link = String(customerViewUrl ?? '').trim();
  const emailFailure = String(emailError ?? '').trim();
  const showLink = !emailSent || Boolean(emailFailure);

  return (
    <SubmitOutcomeSuccess
      iconAccessibilityLabel="Offer sent successfully"
      primaryAction={{ title: 'Done', onPress: onDone }}
      title="Offer sent"
      body={
        emailSent && inbox ? (
          <AppText style={[styles.body, { color: colors.textMuted }]}>
            We&apos;ve emailed{' '}
            <AppText style={[styles.email, { color: colors.text }]}>{inbox}</AppText> a link to
            review the service and pay.
          </AppText>
        ) : emailFailure ? (
          <AppText style={[styles.body, { color: colors.textMuted }]}>
            The offer was created, but we couldn&apos;t email the customer. Copy the link below to
            share it manually.
          </AppText>
        ) : (
          <AppText style={[styles.body, { color: colors.textMuted }]}>
            Copy the offer link below to share it with your customer.
          </AppText>
        )
      }
    >
      {showLink ? (
        <SurfaceCard style={[styles.linkCard, { borderColor: colors.cardBorder }]}>
          <AppText style={[styles.linkLabel, { color: colors.textMuted }]}>Offer link</AppText>
          <AppText selectable style={[styles.linkValue, { color: colors.text }]}>
            {link}
          </AppText>
          {emailFailure ? (
            <AppText style={[styles.emailError, { color: colors.textMuted }]}>
              {emailFailure}
            </AppText>
          ) : null}
        </SurfaceCard>
      ) : null}
    </SubmitOutcomeSuccess>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  email: {
    fontFamily: FONT_FAMILIES.semibold,
    fontWeight: '600',
  },
  linkCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  linkValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  emailError: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
});
