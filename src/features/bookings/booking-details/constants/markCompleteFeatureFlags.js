/**
 * Mark complete rollout flags.
 *
 * - `USE_JOB_COMPLETED_ACTION`: production path calls `POST …/actions` with `job_completed`
 *   (server orchestrates SMS + review link). When false, legacy Supabase complete + review email runs.
 * - `USE_COMPLETE_VISIT_SCREEN`: full complete-visit checkout UI (fees, tap to pay). Off for now.
 * - `SHOW_COMPLETE_VISIT_DESIGN_PREVIEW`: dev Home button for complete-visit / invoice design sheet. Off for now.
 */
export const MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = true;

export const MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN = true;

/** When true (and `__DEV__`), Home shows "Preview complete + invoice". Components stay in repo. */
export const MARK_COMPLETE_SHOW_COMPLETE_VISIT_DESIGN_PREVIEW = true;
