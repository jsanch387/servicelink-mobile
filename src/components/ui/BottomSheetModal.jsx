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
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';

/**
 * Bottom sheet: fixed height from the bottom (`sheetHeightPercent` of the screen),
 * small backdrop strip at the top. Keyboard does not move the sheet — it overlays;
 * on iOS we add extra scroll padding so fields can be scrolled above the keyboard.
 * Android relies on `adjustResize` window height; no extra keyboard padding here.
 */
export function BottomSheetModal({
  visible,
  onRequestClose,
  title,
  children,
  footer = null,
  allowBackdropClose = true,
  /** 30–100: portion of the screen height filled by the sheet (remainder = top backdrop). */
  sheetHeightPercent = 92,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();
  const [mounted, setMounted] = useState(visible);

  const sheetHeight = `${Math.min(100, Math.max(30, sheetHeightPercent))}%`;

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
    if (Platform.OS !== 'ios') return undefined;
    const onShow = (e) => {
      setIosKeyboardScrollPadding(Math.max(0, e?.endCoordinates?.height ?? 0));
    };
    const onHide = () => setIosKeyboardScrollPadding(0);
    const subShow = Keyboard.addListener('keyboardWillShow', onShow);
    const subHide = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

  const scrollContentStyle = useMemo(
    () => [
      styles.sheetContent,
      { paddingBottom: Math.max(insets.bottom, 16) + 12 + iosKeyboardScrollPadding },
    ],
    [insets.bottom, iosKeyboardScrollPadding],
  );

  const content = (
    <>
      <Animated.View pointerEvents="box-none" style={[styles.sheetBackdrop, backdropStyle]}>
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
          {
            backgroundColor: colors.shellElevated,
            height: sheetHeight,
            maxHeight: sheetHeight,
            paddingHorizontal: 16,
            paddingTop: 16,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
        >
          {title ? (
            <AppText style={[styles.sheetTitle, { color: colors.text }]}>{title}</AppText>
          ) : null}
          {title ? (
            <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
          ) : null}
          {children}
          {footer}
        </ScrollView>
      </Animated.View>
    </>
  );

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={onRequestClose}>
      <View style={styles.modalRoot}>
        <BottomSheetOverlayProvider>{content}</BottomSheetOverlayProvider>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    flexDirection: 'column',
    width: '100%',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    flexGrow: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  headerDivider: {
    height: 1,
    marginBottom: 16,
  },
});
