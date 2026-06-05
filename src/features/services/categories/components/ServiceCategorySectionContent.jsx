import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { SERVICE_CATEGORIES_HOW_IT_WORKS_LINK_LABEL } from '../constants/serviceCategoriesHowItWorksCopy';
import { ServiceCategoriesHowItWorksSheet } from './ServiceCategoriesHowItWorksSheet';

export function ServiceCategorySectionContent({
  categories,
  categorySelectOptionsWithNone,
  categoryId,
  onCategoryIdChange,
}) {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const hasCategories = categories.length > 0;

  return (
    <View style={styles.root}>
      {hasCategories ? (
        <SelectField
          fieldStyle={styles.pickerField}
          options={categorySelectOptionsWithNone}
          placeholder="None"
          presentation="wheel"
          title="Category"
          value={categoryId || ''}
          onValueChange={onCategoryIdChange}
        />
      ) : (
        <AppText style={[styles.emptyHint, { color: colors.textMuted }]}>
          No categories yet. Add them from the Categories tab on your services list.
        </AppText>
      )}

      <View style={styles.helpFooter}>
        <Pressable
          accessibilityHint="Opens an explanation of service categories"
          accessibilityRole="button"
          hitSlop={{ bottom: 6, left: 8, right: 4, top: 6 }}
          onPress={() => setSheetVisible(true)}
          style={({ pressed }) => [styles.helpHit, pressed && styles.helpHitPressed]}
        >
          <View style={styles.helpRow}>
            <AppText numberOfLines={1} style={[styles.helpLabel, { color: colors.textMuted }]}>
              {SERVICE_CATEGORIES_HOW_IT_WORKS_LINK_LABEL}
            </AppText>
          </View>
        </Pressable>
      </View>

      <ServiceCategoriesHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    width: '100%',
  },
  helpFooter: {
    alignItems: 'flex-end',
    marginTop: 16,
    width: '100%',
  },
  helpHit: {
    maxWidth: '100%',
  },
  helpHitPressed: {
    opacity: 0.65,
  },
  helpRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  helpLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  emptyHint: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 16,
  },
  pickerField: {
    marginBottom: 0,
    marginTop: 16,
  },
});
