import { StyleSheet } from 'react-native';

/**
 * Single type scale for the Payments screen. Apply `color` (and layout) at the call site.
 * Pairs with `AvailabilityScreen` toggle copy (15/700 + 12/500) where relevant.
 */
export const paymentTextStyles = StyleSheet.create({
  /** Main heading inside a payment card (Stripe, How customers pay, Deposits). */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  /** Intro / explainer paragraph under a section title. */
  sectionBody: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  /** Top card: primary line + hint (matches Availability toggle). */
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  toggleHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  /** Single-line label beside a switch inside a nested card. */
  toggleRowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  /** In-card field label (e.g. Deposit amount). */
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  /** Payment method option title. */
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  /** Muted helper, option description, status under save. */
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  statusCaption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: -4,
    textAlign: 'center',
  },
  /** Currency prefix in amount row — aligns with `useSurfaceInputTextStyle` (15/500). */
  inputPrefix: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 4,
    minWidth: 14,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,
    minWidth: 14,
    textAlign: 'center',
  },
  /** $ / % segment glyphs. */
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

/** Tight title + body grouping inside payment cards. */
export const paymentLayoutStyles = StyleSheet.create({
  headerTextGroup: {
    gap: 6,
    marginBottom: 2,
  },
});
