import { CONTACT_TOPIC_VALUES } from '../constants/contactTopics';

export const CONTACT_NAME_MAX = 120;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 5000;

/**
 * Client-side validation for fields the user edits in-app (topic + message).
 *
 * @param {{ topic: string; message: string }} fields
 * @returns {{ ok: true } | { ok: false; error: string }}
 */
export function validateContactForm(fields) {
  const topic = String(fields.topic ?? '').trim();
  const message = String(fields.message ?? '').trim();

  if (!CONTACT_TOPIC_VALUES.includes(topic)) {
    return { ok: false, error: 'Choose a topic.' };
  }
  if (message.length < CONTACT_MESSAGE_MIN) {
    return {
      ok: false,
      error: `Message must be at least ${CONTACT_MESSAGE_MIN} characters.`,
    };
  }
  if (message.length > CONTACT_MESSAGE_MAX) {
    return {
      ok: false,
      error: `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`,
    };
  }

  return { ok: true };
}
