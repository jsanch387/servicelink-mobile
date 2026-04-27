import {
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

export function BottomSheetModal({
  visible,
  onRequestClose,
  title,
  children,
  footer = null,
  allowBackdropClose = true,
  minHeight = '64%',
  maxHeight = '90%',
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.modalRoot}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeFromBackdrop}
          style={styles.sheetBackdrop}
        />
        <View
          style={[
            styles.sheetWrap,
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
        </View>
      </KeyboardAvoidingView>
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
