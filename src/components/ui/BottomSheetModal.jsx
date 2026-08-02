import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { BottomSheetOverlayProvider } from './bottomSheetOverlay';
import { SheetCloseButton } from './SheetCloseButton';
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';

const GLASS_TOP_RADIUS = 24;
const GLASS_BLUR_INTENSITY = Platform.select({ ios: 95, android: 100, default: 95 });
/**
 * Dark wash under the blur. iOS gets real UIBlurEffect so a light wash is enough;
 * Android BlurView falls back to translucent (no frost), so keep the sheet denser.
 */
const GLASS_SHEET_FILL = Platform.select({
  ios: 'rgba(0, 0, 0, 0.48)',
  android: 'rgba(8, 8, 10, 0.97)',
  default: 'rgba(0, 0, 0, 0.48)',
});
const GLASS_CLIP_FILL = Platform.select({
  ios: 'rgba(0, 0, 0, 0.18)',
  android: 'rgba(12, 12, 14, 0.88)',
  default: 'rgba(0, 0, 0, 0.18)',
});
const GLASS_BACKDROP = Platform.select({
  ios: 'rgba(0,0,0,0.38)',
  android: 'rgba(0,0,0,0.58)',
  default: 'rgba(0,0,0,0.38)',
});

/**
 * Cross-platform sheet.
 *
 * - **iOS** (tall sheets): native `pageSheet` (Apple system sheet + grabber).
 * - **iOS** (`fitContent` short sheets) + **Android**: overlay sheet from the bottom
 *   with rounded top corners (Android’s common bottom-sheet pattern).
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {string} [props.title]
 * @param {string | null} [props.subtitle]
 * @param {import('react').ReactNode} [props.children]
 * @param {import('react').ReactNode} [props.footer]
 * @param {boolean} [props.allowBackdropClose]
 * @param {number} [props.sheetHeightPercent]
 * @param {boolean} [props.fitContent]
 * @param {boolean} [props.stickyFooter]
 * @param {boolean} [props.liftFooterWithKeyboard] — when false, sticky footer stays put while typing; scroll content still pads so focused fields stay visible
 * @param {boolean} [props.showCloseButton] — default true for native page sheets / tall overlay sheets
 * @param {boolean} [props.centerContent] — vertically center children in the scroll area
 * @param {boolean} [props.showHeaderDivider] — title underline rule; default true
 * @param {'default' | 'glass'} [props.appearance]
 *   - `default` — legacy solid elevated sheet (all existing call sites)
 *   - `glass` — **experimental** frosted BlurView sheet (On my way confirm + Job status for now)
 */
export function BottomSheetModal({
  visible,
  onRequestClose,
  title,
  subtitle = null,
  children,
  footer = null,
  allowBackdropClose = true,
  sheetHeightPercent = 92,
  fitContent = false,
  stickyFooter = false,
  liftFooterWithKeyboard = true,
  showCloseButton,
  centerContent = false,
  showHeaderDivider = true,
  appearance = 'default',
}) {
  // Glass sheets need the transparent overlay path so BlurView can frost the screen behind.
  const useNativePageSheet = Platform.OS === 'ios' && !fitContent && appearance !== 'glass';
  const showClose =
    showCloseButton ?? (useNativePageSheet || (!fitContent && sheetHeightPercent >= 70));

  if (useNativePageSheet) {
    return (
      <NativePageSheetModal
        allowBackdropClose={allowBackdropClose}
        centerContent={centerContent}
        footer={footer}
        liftFooterWithKeyboard={liftFooterWithKeyboard}
        showCloseButton={showClose}
        showHeaderDivider={showHeaderDivider}
        stickyFooter={stickyFooter}
        subtitle={subtitle}
        title={title}
        visible={visible}
        onRequestClose={onRequestClose}
      >
        {children}
      </NativePageSheetModal>
    );
  }

  return (
    <OverlayBottomSheetModal
      allowBackdropClose={allowBackdropClose}
      appearance={appearance}
      centerContent={centerContent}
      fitContent={fitContent}
      footer={footer}
      liftFooterWithKeyboard={liftFooterWithKeyboard}
      sheetHeightPercent={sheetHeightPercent}
      showCloseButton={showClose}
      showHeaderDivider={showHeaderDivider}
      stickyFooter={stickyFooter}
      subtitle={subtitle}
      title={title}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {children}
    </OverlayBottomSheetModal>
  );
}

/**
 * iOS UIKit page sheet.
 */
function NativePageSheetModal({
  visible,
  onRequestClose,
  title,
  subtitle,
  children,
  footer,
  stickyFooter,
  liftFooterWithKeyboard = true,
  showCloseButton,
  showHeaderDivider = true,
  centerContent,
  allowBackdropClose,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);
  const useStickyFooter = Boolean(stickyFooter && footer);
  const footerKeyboardPadding = liftFooterWithKeyboard ? iosKeyboardScrollPadding : 0;
  const scrollKeyboardPadding = iosKeyboardScrollPadding;

  useEffect(() => {
    if (!visible) setIosKeyboardScrollPadding(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const onShow = (e) => {
      setIosKeyboardScrollPadding(Math.max(0, e?.endCoordinates?.height ?? 0));
    };
    const onHide = () => setIosKeyboardScrollPadding(0);
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  const styles = useMemo(
    () => createSharedSheetStyles(colors, insets, { nativePageSheet: true }),
    [colors, insets],
  );

  const scrollContentStyle = useMemo(
    () => [
      styles.sheetContent,
      useStickyFooter
        ? { paddingBottom: 12 + scrollKeyboardPadding }
        : { paddingBottom: Math.max(insets.bottom, 16) + 12 + scrollKeyboardPadding },
      centerContent ? styles.centerContent : null,
    ],
    [styles, useStickyFooter, scrollKeyboardPadding, insets.bottom, centerContent],
  );

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={() => {
        if (allowBackdropClose) onRequestClose?.();
      }}
    >
      <View style={styles.nativeRoot}>
        <SheetHeader
          showCloseButton={showCloseButton}
          showHeaderDivider={showHeaderDivider}
          styles={styles}
          subtitle={subtitle}
          title={title}
          onRequestClose={onRequestClose}
        />
        {useStickyFooter ? (
          <>
            <ScrollView
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={scrollContentStyle}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
            >
              {children}
            </ScrollView>
            <View
              style={[
                styles.stickyFooter,
                {
                  marginBottom: footerKeyboardPadding,
                  paddingBottom: Math.max(insets.bottom, 16),
                },
              ]}
            >
              {footer}
            </View>
          </>
        ) : (
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={scrollContentStyle}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {children}
            {footer}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

/**
 * Android + short iOS sheets: dimmed overlay + sliding panel.
 */
function OverlayBottomSheetModal({
  visible,
  onRequestClose,
  title,
  subtitle,
  children,
  footer,
  allowBackdropClose,
  sheetHeightPercent,
  fitContent,
  stickyFooter,
  liftFooterWithKeyboard = true,
  showCloseButton,
  showHeaderDivider = true,
  centerContent,
  appearance = 'default',
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);
  const isGlass = appearance === 'glass';

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet({ motion: isGlass ? 'glass' : 'default' });
  const [mounted, setMounted] = useState(visible);

  const sheetHeight = `${Math.min(100, Math.max(30, sheetHeightPercent))}%`;
  const useStickyFooter = Boolean(stickyFooter && footer && !fitContent);
  const showGrabber = Platform.OS === 'android' && !fitContent && !isGlass;
  const footerKeyboardPadding = liftFooterWithKeyboard ? iosKeyboardScrollPadding : 0;
  const scrollKeyboardPadding = iosKeyboardScrollPadding;

  useEffect(() => {
    if (visible) {
      prepareOpen();
      setMounted(true);
    }
  }, [visible, prepareOpen]);

  useEffect(() => {
    if (!mounted) return undefined;
    if (visible) {
      const id = requestAnimationFrame(() => runOpen());
      return () => cancelAnimationFrame(id);
    }
    runClose(() => setMounted(false));
    return undefined;
  }, [mounted, visible, runOpen, runClose]);

  useEffect(() => {
    if (!visible) setIosKeyboardScrollPadding(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const onShow = (e) => {
      setIosKeyboardScrollPadding(Math.max(0, e?.endCoordinates?.height ?? 0));
    };
    const onHide = () => setIosKeyboardScrollPadding(0);
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

  const scrollPaddingBottom = useMemo(
    () => Math.max(insets.bottom, 16) + 12 + scrollKeyboardPadding,
    [insets.bottom, scrollKeyboardPadding],
  );

  const fitSheetPaddingBottom = useMemo(() => Math.max(insets.bottom, 16) + 8, [insets.bottom]);

  const stickyFooterPaddingBottom = useMemo(() => Math.max(insets.bottom, 16), [insets.bottom]);

  const styles = useMemo(
    () =>
      createSharedSheetStyles(colors, insets, {
        nativePageSheet: false,
      }),
    [colors, insets],
  );

  const scrollContentStyle = useMemo(
    () => [
      styles.sheetContent,
      fitContent && styles.sheetContentFit,
      !fitContent && !useStickyFooter && { paddingBottom: scrollPaddingBottom },
      useStickyFooter && { paddingBottom: 12 + scrollKeyboardPadding },
      centerContent ? styles.centerContent : null,
    ],
    [
      styles,
      fitContent,
      scrollPaddingBottom,
      useStickyFooter,
      scrollKeyboardPadding,
      centerContent,
    ],
  );

  const headerBlock = (
    <SheetHeader
      showCloseButton={showCloseButton}
      showHeaderDivider={showHeaderDivider}
      styles={styles}
      subtitle={subtitle}
      title={title}
      onRequestClose={onRequestClose}
    />
  );

  const sheetBody = (
    <>
      {headerBlock}
      {children}
      {!useStickyFooter ? footer : null}
    </>
  );

  const sheetInner = (
    <>
      {showGrabber ? <View style={styles.grabber} /> : null}
      {fitContent ? (
        <View style={[scrollContentStyle, styles.sheetFitInner]}>{sheetBody}</View>
      ) : useStickyFooter ? (
        <>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={scrollContentStyle}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {headerBlock}
            {children}
          </ScrollView>
          <View
            style={[
              styles.stickyFooter,
              {
                marginBottom: footerKeyboardPadding,
                paddingBottom: stickyFooterPaddingBottom,
              },
            ]}
          >
            {footer}
          </View>
        </>
      ) : (
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
        >
          {sheetBody}
        </ScrollView>
      )}
    </>
  );

  const sheetClipStyle = [
    styles.sheetClip,
    isGlass ? styles.sheetClipGlass : null,
    {
      backgroundColor: isGlass ? GLASS_CLIP_FILL : colors.shellElevated,
      paddingHorizontal: isGlass ? 20 : 16,
      paddingTop: isGlass ? 16 : showGrabber ? 8 : 16,
      paddingBottom: fitContent ? fitSheetPaddingBottom : undefined,
      ...(fitContent ? null : { flex: 1 }),
    },
  ];

  const content = (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.sheetBackdrop,
          backdropStyle,
          isGlass ? { backgroundColor: GLASS_BACKDROP } : null,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeFromBackdrop}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheetWrap,
          sheetStyle,
          isGlass ? styles.sheetWrapGlass : null,
          {
            backgroundColor: isGlass ? GLASS_SHEET_FILL : 'transparent',
            ...(fitContent
              ? {
                  marginBottom: footerKeyboardPadding,
                }
              : { height: sheetHeight, maxHeight: sheetHeight }),
          },
        ]}
      >
        {isGlass ? (
          <BlurView intensity={GLASS_BLUR_INTENSITY} style={sheetClipStyle} tint="dark">
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.045)',
                'rgba(255,255,255,0.02)',
                'rgba(255,255,255,0.006)',
                'transparent',
              ]}
              end={{ x: 0.5, y: 1 }}
              locations={[0, 0.22, 0.55, 1]}
              pointerEvents="none"
              start={{ x: 0.5, y: 0 }}
              style={styles.glassTopGlow}
            />
            {sheetInner}
          </BlurView>
        ) : (
          <View style={sheetClipStyle}>{sheetInner}</View>
        )}
      </Animated.View>
    </>
  );

  return (
    <Modal
      animationType="none"
      statusBarTranslucent={Platform.OS === 'android'}
      transparent
      visible={mounted}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalRoot}>
        <BottomSheetOverlayProvider>{content}</BottomSheetOverlayProvider>
      </View>
    </Modal>
  );
}

function SheetHeader({
  title,
  subtitle,
  showCloseButton,
  showHeaderDivider = true,
  onRequestClose,
  styles,
}) {
  const { colors } = useTheme();
  if (!title && !subtitle && !showCloseButton) return null;

  return (
    <View style={styles.header}>
      {title || showCloseButton ? (
        <View style={[styles.titleRow, !subtitle ? styles.titleRowSolo : null]}>
          {title ? (
            <AppText
              style={[
                styles.sheetTitle,
                subtitle ? styles.sheetTitleWithSubtitle : null,
                { color: colors.text },
              ]}
            >
              {title}
            </AppText>
          ) : (
            <View style={styles.titleSpacer} />
          )}
          {showCloseButton ? <SheetCloseButton onPress={onRequestClose} /> : null}
        </View>
      ) : null}
      {subtitle ? (
        <AppText
          style={[
            styles.sheetSubtitle,
            { color: colors.textMuted },
            showCloseButton ? styles.sheetSubtitleBesideClose : null,
          ]}
        >
          {subtitle}
        </AppText>
      ) : null}
      {title && showHeaderDivider ? (
        <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

function createSharedSheetStyles(colors, insets, { nativePageSheet }) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
      position: 'relative',
    },
    nativeRoot: {
      backgroundColor: colors.shellElevated,
      flex: 1,
      paddingHorizontal: 16,
    },
    sheetBackdrop: {
      backgroundColor: 'rgba(0,0,0,0.76)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    sheetWrap: {
      borderTopLeftRadius: Platform.OS === 'android' ? 28 : 18,
      borderTopRightRadius: Platform.OS === 'android' ? 28 : 18,
      flexDirection: 'column',
      width: '100%',
    },
    sheetWrapGlass: {
      borderTopLeftRadius: GLASS_TOP_RADIUS,
      borderTopRightRadius: GLASS_TOP_RADIUS,
      elevation: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.4,
      shadowRadius: 28,
    },
    sheetClip: {
      borderTopLeftRadius: Platform.OS === 'android' ? 28 : 18,
      borderTopRightRadius: Platform.OS === 'android' ? 28 : 18,
      flexDirection: 'column',
      overflow: 'hidden',
      width: '100%',
    },
    sheetClipGlass: {
      borderTopLeftRadius: GLASS_TOP_RADIUS,
      borderTopRightRadius: GLASS_TOP_RADIUS,
      overflow: 'hidden',
    },
    glassTopGlow: {
      height: 44,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 1,
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: colors.borderStrong,
      borderRadius: 999,
      height: 4,
      marginBottom: 10,
      marginTop: 4,
      opacity: 0.7,
      width: 40,
    },
    header: {
      paddingBottom: 0,
      paddingTop: nativePageSheet ? 28 : 0,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      marginBottom: 2,
    },
    titleRowSolo: {
      marginBottom: 12,
    },
    titleSpacer: {
      flex: 1,
    },
    sheetScroll: {
      flex: 1,
    },
    sheetContent: {
      flexGrow: 1,
    },
    sheetContentFit: {
      flexGrow: 0,
      flexShrink: 0,
    },
    sheetFitInner: {
      alignSelf: 'stretch',
      width: '100%',
      zIndex: 3,
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetTitle: {
      flex: 1,
      fontSize: nativePageSheet ? 20 : 18,
      fontWeight: '800',
      letterSpacing: nativePageSheet ? -0.3 : 0,
      marginBottom: 0,
      minWidth: 0,
    },
    sheetTitleWithSubtitle: {
      marginBottom: 0,
    },
    sheetSubtitle: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 19,
      marginBottom: 14,
    },
    sheetSubtitleBesideClose: {
      paddingRight: 40,
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      marginBottom: 16,
    },
    stickyFooter: {
      paddingTop: 12,
    },
  });
}
