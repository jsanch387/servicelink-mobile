import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { BOTTOM_SHEET_GLASS_ENABLED } from '../../../components/ui/bottomSheetAppearance';
import { useTheme } from '../../../theme';
import { fireSelectionHaptic } from '../../../utils/feedbackHaptics';

/**
 * Confirm before skipping the “job done” customer text from Next Up.
 * Matches On my way / Done confirm modal visual language (icon badge; glass when enabled).
 *
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 *   onConfirmSkip: () => void;
 * }} props
 */
export function SkipWorkNotifyConfirmModal({ visible, onRequestClose, onConfirmSkip }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stage: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
          paddingBottom: 20,
          paddingHorizontal: 8,
          paddingTop: 12,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 16,
          elevation: 4,
          height: 60,
          justifyContent: 'center',
          marginBottom: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          width: 60,
        },
        body: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 23,
          alignSelf: 'stretch',
          textAlign: 'center',
        },
        footer: {
          minHeight: 56,
        },
        row: {
          flexDirection: 'row',
          gap: 10,
        },
        rowGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      appearance={BOTTOM_SHEET_GLASS_ENABLED ? 'glass' : 'default'}
      fitContent
      footer={
        <View style={styles.footer}>
          <View style={styles.row}>
            <View style={styles.rowGrow}>
              <Button
                accessibilityLabel="Cancel"
                fullWidth
                title="Cancel"
                variant="secondary"
                onPress={onRequestClose}
              />
            </View>
            <View style={styles.rowGrow}>
              <Button
                accessibilityHint="Continues without texting the customer"
                accessibilityLabel="Continue"
                fullWidth
                title="Continue"
                variant="primary"
                onPress={() => {
                  fireSelectionHaptic();
                  onConfirmSkip();
                }}
              />
            </View>
          </View>
        </View>
      }
      showCloseButton
      showHeaderDivider
      title="Skip texting?"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.stage}>
        <View style={styles.iconBadge}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.buttonPrimaryText}
            importantForAccessibility="no"
            name="chatbubble-ellipses-outline"
            size={28}
          />
        </View>
        <AppText style={styles.body}>Continue without telling your customer you’re done.</AppText>
      </View>
    </BottomSheetModal>
  );
}
