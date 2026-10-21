import { posthog } from './posthog';

export const posthogLog = {
  info(body, attributes) {
    posthog?.logger.info(body, attributes);
  },
};
