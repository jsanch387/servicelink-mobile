import { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
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
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';

export function BottomSheetModal({
  visible,
  onRequestClose,
  title,
  children,
  footer = null,
  allowBackdropClose = true,
  minHeight = '64%',
  maxHeight = '90%',
  keyboardBehavior,
  disableKeyboardAvoiding = false,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedKeyboardBehavior =
    keyboardBehavior ?? (Platform.OS === 'ios' ? 'padding' : 'height');

  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();
  const [mounted, setMounted] = useState(visible);

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

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

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
            maxHeight,
            minHeight,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
      {disableKeyboardAvoiding ? (
        <View style={styles.modalRoot}>{content}</View>
      ) : (
        <KeyboardAvoidingView
          behavior={resolvedKeyboardBehavior}
          keyboardVerticalOffset={0}
          style={styles.modalRoot}
        >
          {content}
        </KeyboardAvoidingView>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
  },
  sheetContent: {
    paddingBottom: 6,
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
