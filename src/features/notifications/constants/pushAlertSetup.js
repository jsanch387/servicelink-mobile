/** Must match the server Expo payload `channelId`. */
export const ANDROID_PUSH_CHANNEL_ID = 'default';

/** User-visible Android channel name (system notification settings). */
export const ANDROID_PUSH_CHANNEL_NAME = 'ServiceLink';

/** iOS permission flags so the OS can play the server `sound: "default"` payload. */
export const PUSH_PERMISSION_REQUEST = Object.freeze({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
});
