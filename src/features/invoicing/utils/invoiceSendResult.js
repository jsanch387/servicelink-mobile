/**
 * What to show after a 200 from send. A channel that was not attempted is not a failure.
 *
 * @param {{
 *   emailAttempted?: boolean;
 *   emailSent?: boolean;
 *   emailError?: string | null;
 *   smsAttempted?: boolean;
 *   smsSent?: boolean;
 *   smsError?: string | null;
 * }} result
 * @returns {{ kind: 'sent' | 'warning' | 'failed'; message: string }}
 */
export function describeInvoiceSendResult(result) {
  const emailFailed = Boolean(result?.emailAttempted) && !result?.emailSent;
  const smsFailed = Boolean(result?.smsAttempted) && !result?.smsSent;

  if (!emailFailed && !smsFailed) {
    return { kind: 'sent', message: 'Invoice sent.' };
  }

  if (emailFailed && smsFailed) {
    return {
      kind: 'failed',
      message: result.emailError || result.smsError || 'Could not send this invoice.',
    };
  }

  if (emailFailed && !result?.smsAttempted) {
    return { kind: 'failed', message: result.emailError || 'Could not send this invoice.' };
  }

  if (smsFailed && !result?.emailAttempted) {
    return { kind: 'failed', message: result.smsError || 'Could not send this invoice.' };
  }

  const sentLabel = emailFailed ? 'Invoice texted.' : 'Invoice emailed.';
  const error = emailFailed ? result.emailError : result.smsError;
  return { kind: 'warning', message: error ? `${sentLabel} ${error}` : sentLabel };
}

/**
 * Confirmation copy under the success title. A partial delivery keeps the warning.
 *
 * @param {Parameters<typeof describeInvoiceSendResult>[0]} result
 * @param {{ customerEmail?: string | null }} [contact]
 */
export function invoiceSendConfirmationBody(result, contact = {}) {
  const outcome = describeInvoiceSendResult(result);
  if (outcome.kind === 'warning') return outcome.message;
  const email = String(contact.customerEmail ?? '').trim();
  if (result?.emailSent && result?.smsSent) return "We've emailed and texted the invoice.";
  if (result?.emailSent && email) return `We've sent the invoice to ${email}.`;
  if (result?.emailSent) return "We've emailed the invoice.";
  if (result?.smsSent) return "We've texted the invoice.";
  return "We've sent the invoice.";
}
