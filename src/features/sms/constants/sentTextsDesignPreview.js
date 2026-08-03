/**
 * When true and the business has no logged SMS yet, Sent Texts shows sample rows
 * so the timeline UI can be reviewed. Real `sms_messages` rows always win.
 *
 * Off in production: businesses with no sends see the empty state instead, so
 * sample rows can never be mistaken for real customer texts.
 */
export const SENT_TEXTS_DESIGN_PREVIEW = false;
