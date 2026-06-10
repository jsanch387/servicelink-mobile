import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_REVIEW_PROMPT_HISTORY_KEY } from '../constants';

/**
 * @typedef {{ lastPromptedAt: string | null; promptCount: number }} AppReviewPromptHistory
 */

/** @type {AppReviewPromptHistory} */
const EMPTY_HISTORY = { lastPromptedAt: null, promptCount: 0 };

/**
 * @param {unknown} raw
 * @returns {AppReviewPromptHistory}
 */
export function parseAppReviewPromptHistory(raw) {
  if (raw == null || raw === '') {
    return { ...EMPTY_HISTORY };
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...EMPTY_HISTORY };
    }
    const lastPromptedAt =
      typeof parsed.lastPromptedAt === 'string' && !Number.isNaN(Date.parse(parsed.lastPromptedAt))
        ? parsed.lastPromptedAt
        : null;
    const promptCount =
      typeof parsed.promptCount === 'number' && Number.isFinite(parsed.promptCount)
        ? Math.max(0, Math.floor(parsed.promptCount))
        : 0;
    return { lastPromptedAt, promptCount };
  } catch {
    return { ...EMPTY_HISTORY };
  }
}

/** @returns {Promise<AppReviewPromptHistory>} */
export async function readAppReviewPromptHistory() {
  try {
    const raw = await AsyncStorage.getItem(APP_REVIEW_PROMPT_HISTORY_KEY);
    return parseAppReviewPromptHistory(raw);
  } catch {
    return { ...EMPTY_HISTORY };
  }
}

/** @param {Date} [promptedAt] */
export async function recordAppReviewPromptAttempt(promptedAt = new Date()) {
  try {
    const current = await readAppReviewPromptHistory();
    /** @type {AppReviewPromptHistory} */
    const next = {
      lastPromptedAt: promptedAt.toISOString(),
      promptCount: current.promptCount + 1,
    };
    await AsyncStorage.setItem(APP_REVIEW_PROMPT_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function clearAppReviewPromptHistory() {
  try {
    await AsyncStorage.removeItem(APP_REVIEW_PROMPT_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
