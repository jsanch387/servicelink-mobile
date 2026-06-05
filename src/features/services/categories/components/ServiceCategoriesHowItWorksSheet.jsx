import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  SERVICE_CATEGORIES_HOW_IT_WORKS_DISMISS_LABEL,
  SERVICE_CATEGORIES_HOW_IT_WORKS_INTRO,
  SERVICE_CATEGORIES_HOW_IT_WORKS_ITEMS,
  SERVICE_CATEGORIES_HOW_IT_WORKS_OPTIONAL_NOTE,
  SERVICE_CATEGORIES_HOW_IT_WORKS_TITLE,
} from '../constants/serviceCategoriesHowItWorksCopy';

export function ServiceCategoriesHowItWorksSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
          marginBottom: 16,
        },
        listCard: {
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          overflow: 'hidden',
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        rowDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 56,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          marginRight: 12,
          marginTop: 1,
          width: 36,
        },
        rowText: {
          flex: 1,
          minWidth: 0,
        },
        rowTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
          lineHeight: 20,
        },
        rowBody: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 19,
          marginTop: 3,
        },
        optionalNote: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          marginTop: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        optionalText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 19,
        },
        footer: {
          marginTop: 16,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={SERVICE_CATEGORIES_HOW_IT_WORKS_DISMISS_LABEL}
            variant="secondary"
            onPress={onRequestClose}
          />
        </View>
      }
      title={SERVICE_CATEGORIES_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <AppText style={styles.intro}>{SERVICE_CATEGORIES_HOW_IT_WORKS_INTRO}</AppText>

      <View style={styles.listCard}>
        {SERVICE_CATEGORIES_HOW_IT_WORKS_ITEMS.map((item, index) => (
          <View key={item.title}>
            {index > 0 ? <View style={styles.rowDivider} /> : null}
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons color={colors.textSecondary} name={item.icon} size={18} />
              </View>
              <View style={styles.rowText}>
                <AppText style={styles.rowTitle}>{item.title}</AppText>
                <AppText style={styles.rowBody}>{item.body}</AppText>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.optionalNote}>
        <AppText style={styles.optionalText}>
          {SERVICE_CATEGORIES_HOW_IT_WORKS_OPTIONAL_NOTE}
        </AppText>
      </View>
    </BottomSheetModal>
  );
}
