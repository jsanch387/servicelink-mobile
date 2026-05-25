import { AppText, SubmitOutcomeSuccess } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * @param {object} props
 * @param {string} props.customerEmail
 */
export function CreateQuoteSendSuccess({ customerEmail }) {
  const { colors } = useTheme();
  const email = String(customerEmail ?? '').trim();

  return (
    <SubmitOutcomeSuccess
      iconAccessibilityLabel="Quote sent successfully"
      title="Quote sent"
      variant="inline"
      body={
        email ? (
          <AppText
            style={{
              alignSelf: 'stretch',
              color: colors.textMuted,
              fontFamily: FONT_FAMILIES.medium,
              fontSize: 16,
              fontWeight: '500',
              letterSpacing: -0.15,
              lineHeight: 24,
              textAlign: 'center',
            }}
          >
            We&apos;ve sent the quote to{' '}
            <AppText
              style={{
                color: colors.text,
                fontFamily: FONT_FAMILIES.semibold,
                fontWeight: '600',
              }}
            >
              {email}
            </AppText>{' '}
            so they can accept or decline.
          </AppText>
        ) : (
          <AppText
            style={{
              alignSelf: 'stretch',
              color: colors.textMuted,
              fontFamily: FONT_FAMILIES.medium,
              fontSize: 16,
              fontWeight: '500',
              letterSpacing: -0.15,
              lineHeight: 24,
              textAlign: 'center',
            }}
          >
            We&apos;ve sent the quote to your customer so they can accept or decline.
          </AppText>
        )
      }
    />
  );
}
