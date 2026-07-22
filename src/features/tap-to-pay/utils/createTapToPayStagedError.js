/**
 * Error thrown from Tap to Pay Terminal steps so sheet reporting can store `stage` + `code`.
 *
 * @param {string} stage
 * @param {string} message
 * @param {string | null | undefined} [code]
 * @returns {Error & { stage: string; code?: string }}
 */
export function createTapToPayStagedError(stage, message, code) {
  const err = /** @type {Error & { stage: string; code?: string }} */ (new Error(message));
  err.stage = stage;
  if (code) {
    err.code = String(code);
  }
  return err;
}
