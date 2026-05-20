/**
 * App Store–safe copy when multiple service prices need account changes on web.
 */
export const serviceMultiplePricingAccessCopy = {
  hint: 'Sign in on the ServiceLink website to add multiple pricing options to your services.',
  alertTitle: 'Multiple prices',
  alertMessage:
    'To add multiple pricing options per service, sign in on the ServiceLink website with the same email you use in this app.',
  buttonTitle: 'Sign in on the web',
  /** Collapsed section subtitle when user already has saved options but cannot edit in-app. */
  collapsedSubtitleWithSaved: (count) => `${count} saved · manage on the ServiceLink website`,
  collapsedSubtitleEmpty: 'Multiple prices',
};
