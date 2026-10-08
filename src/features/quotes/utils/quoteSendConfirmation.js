/**
 * Confirmation line after a quote send. Names only the channels that went out.
 *
 * @param {{ emailSent?: boolean; smsSent?: boolean }} [result]
 * @returns {string}
 */
export function quoteSendConfirmationBody(result = {}) {
  const emailed = Boolean(result.emailSent);
  const texted = Boolean(result.smsSent);
  if (emailed && texted) return "We've emailed and texted the quote.";
  if (emailed) return "We've emailed the quote.";
  if (texted) return "We've texted the quote.";
  return "We've sent the quote.";
}
