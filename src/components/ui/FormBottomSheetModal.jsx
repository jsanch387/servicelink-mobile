import { StyleSheet, View } from 'react-native';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';

/**
 * Shared tall bottom sheet for simple forms: `BottomSheetModal` + standard Cancel / primary actions.
 * Use for add-on, add-service style flows; feature screens pass fields as `children`.
 * Footer pins to the bottom of the sheet (`stickyFooter`) and stays under the
 * keyboard while typing (`liftFooterWithKeyboard={false}`).
 */
export function FormBottomSheetModal({
  visible,
  onRequestClose,
  title,
  allowBackdropClose = false,
  sheetHeightPercent = 92,
  cancelTitle = 'Cancel',
  primaryTitle,
  primaryDisabled = false,
  primaryLoading = false,
  onPrimaryPress,
  children,
}) {
  return (
    <BottomSheetModal
      allowBackdropClose={allowBackdropClose}
      footer={
        <View style={styles.actions}>
          <Button
            disabled={primaryLoading}
            fullWidth
            style={styles.actionBtn}
            title={cancelTitle}
            variant="secondary"
            onPress={onRequestClose}
          />
          <Button
            disabled={primaryDisabled}
            fullWidth
            loading={primaryLoading}
            style={styles.actionBtn}
            title={primaryTitle}
            variant="surfaceLight"
            onPress={() => {
              void onPrimaryPress?.();
            }}
          />
        </View>
      }
      liftFooterWithKeyboard={false}
      sheetHeightPercent={sheetHeightPercent}
      stickyFooter
      title={title}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {children}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
