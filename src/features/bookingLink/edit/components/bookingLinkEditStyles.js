import { StyleSheet } from 'react-native';

/** Vertical gap between stacked edit sections (no hairline dividers). */
const SECTION_STACK_GAP = 24;

/** Even vertical rhythm for edit-mode chrome (header → tabs → content). */
const EDIT_CHROME_GAP = 12;

/** @param {object} colors Theme palette from `useTheme()`. */
export function createBookingLinkEditStyles(colors, galleryGap) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    scroll: {
      flex: 1,
    },
    scrollTopPad: {
      paddingTop: EDIT_CHROME_GAP,
    },
    stickyTabsShell: {
      backgroundColor: colors.shell,
      zIndex: 10,
    },
    tabPanel: {
      paddingTop: EDIT_CHROME_GAP,
    },
    content: {},
    tabPanelFirstSection: {
      marginTop: 0,
    },
    bookingTabSection: {
      alignSelf: 'stretch',
    },
    bookingBlock: {
      marginBottom: SECTION_STACK_GAP,
    },
    bookingHelperText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '400',
      letterSpacing: -0.05,
      lineHeight: 18,
      marginTop: 12,
    },
    bookingShopFields: {
      marginTop: 14,
    },
    bookingAreaFooter: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -16,
      marginTop: 14,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    bookingAreaFooterText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 17,
    },
    bookingAreaFooterLink: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 17,
      textDecorationLine: 'underline',
    },
    bookingLanguageRowSolo: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bookingLanguageDefaultRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 14,
    },
    bookingLanguageLabel: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: -0.15,
      minWidth: 0,
      paddingRight: 12,
    },
    inlineSegmentTrack: {
      backgroundColor: colors.shellElevated,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      padding: 4,
    },
    inlineSegmentTrackCompact: {
      flexShrink: 0,
    },
    inlineSegmentOption: {
      alignItems: 'center',
      borderRadius: 8,
      flex: 1,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 8,
    },
    inlineSegmentOptionCompact: {
      flex: 0,
      minWidth: 76,
      paddingHorizontal: 12,
    },
    inlineSegmentOptionActive: {
      backgroundColor: colors.accent,
    },
    inlineSegmentLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    inlineSegmentLabelActive: {
      color: colors.shell,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    sectionBody: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: -0.1,
      lineHeight: 17,
      marginBottom: 12,
    },
    coverSurfaceWrap: {
      alignSelf: 'stretch',
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
    },
    coverCardPressed: {
      opacity: 0.94,
    },
    coverInnerPressable: {
      overflow: 'hidden',
      width: '100%',
    },
    coverImage: {
      aspectRatio: 16 / 8.2,
      width: '100%',
    },
    coverFallback: {
      alignItems: 'center',
      backgroundColor: colors.shellElevated,
      justifyContent: 'center',
    },
    coverFallbackHint: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 10,
    },
    coverCta: {
      alignItems: 'center',
      backgroundColor: 'rgba(10,10,10,0.76)',
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 14,
      borderWidth: 1,
      bottom: 12,
      flexDirection: 'row',
      left: 12,
      minHeight: 44,
      paddingHorizontal: 14,
      position: 'absolute',
    },
    coverCtaText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 8,
    },
    coverCamera: {
      alignItems: 'center',
      backgroundColor: 'rgba(10,10,10,0.76)',
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      borderWidth: 1,
      bottom: 12,
      height: 40,
      justifyContent: 'center',
      position: 'absolute',
      right: 12,
      width: 40,
    },
    logoSection: {
      marginTop: SECTION_STACK_GAP,
    },
    logoSurfaceCard: {
      alignSelf: 'stretch',
      width: '100%',
    },
    logoCardPressable: {
      minHeight: 104,
      width: '100%',
    },
    logoCardPressed: {
      opacity: 0.94,
    },
    logoCardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
    },
    logoPreviewWrap: {
      alignItems: 'center',
      backgroundColor: colors.border,
      borderColor: colors.borderStrong,
      borderRadius: 44,
      borderWidth: 2,
      height: 88,
      justifyContent: 'center',
      marginRight: 12,
      overflow: 'hidden',
      width: 88,
    },
    logoPreviewImage: {
      height: '100%',
      width: '100%',
    },
    logoInfo: {
      flex: 0.92,
      minWidth: 0,
      paddingRight: 4,
    },
    logoTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    logoSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 17,
    },
    logoAction: {
      alignItems: 'center',
      backgroundColor: colors.shellElevated,
      borderColor: colors.borderStrong,
      borderRadius: 999,
      borderWidth: 1,
      flexShrink: 0,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    infoSection: {
      marginTop: SECTION_STACK_GAP,
    },
    editSectionCard: {
      alignSelf: 'stretch',
      marginTop: 10,
      paddingHorizontal: 16,
      width: '100%',
    },
    infoField: {
      marginBottom: 14,
    },
    infoFieldLast: {
      marginBottom: 2,
    },
    locationFieldsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    locationFieldState: {
      flex: 0.42,
      minWidth: 0,
    },
    locationFieldZip: {
      flex: 0.58,
      minWidth: 0,
    },
    bioSection: {
      marginTop: SECTION_STACK_GAP,
    },
    bioFieldWrap: {
      marginTop: 10,
    },
    infoSelectFieldFlushTop: {
      marginTop: 0,
    },
    contactSection: {
      marginTop: SECTION_STACK_GAP,
    },
    gallerySection: {
      marginTop: SECTION_STACK_GAP,
    },
    freeTierGalleryHint: {
      alignItems: 'flex-start',
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    freeTierGalleryHintText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: -0.1,
      lineHeight: 19,
      minWidth: 0,
    },
    freeTierGalleryHintLink: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.1,
      lineHeight: 19,
      textDecorationLine: 'underline',
    },
    galleryAddPhotoOuter: {
      alignSelf: 'stretch',
      backgroundColor: colors.shellElevated,
      borderRadius: 20,
      padding: 24,
      width: '100%',
    },
    galleryAddPhotoPressable: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    galleryAddPhotoAreaPressed: {
      opacity: 0.94,
    },
    galleryAddStack: {
      alignItems: 'center',
      gap: 10,
      justifyContent: 'center',
      maxWidth: '100%',
    },
    addPhotoTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    addPhotoSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      textAlign: 'center',
    },
    galleryImagesHeading: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
      marginBottom: 12,
      marginTop: 20,
    },
    portfolioGrid: {
      alignContent: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: galleryGap,
      justifyContent: 'flex-start',
    },
    portfolioTileWrap: {
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexGrow: 0,
      flexShrink: 0,
      overflow: 'hidden',
    },
    portfolioTileImage: {
      height: '100%',
      width: '100%',
    },
    portfolioRemove: {
      alignItems: 'center',
      backgroundColor: 'rgba(10,10,10,0.62)',
      borderRadius: 999,
      height: 26,
      justifyContent: 'center',
      position: 'absolute',
      right: 6,
      top: 6,
      width: 26,
    },
    bioInput: {
      minHeight: 128,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
  });
}
