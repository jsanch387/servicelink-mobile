import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  DeleteButton,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { expenseCategoryLabel } from '../constants/expenseCategories';
import { formatExpenseDateFieldLabel } from '../utils/expenseDate';
import { formatExpenseDollars } from '../utils/expenseMoney';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {boolean} [props.emphasize]
 */
function ExpenseDetailField({ label, value, emphasize = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          gap: 4,
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        value: {
          color: colors.text,
          fontFamily: emphasize ? FONT_FAMILIES.semibold : FONT_FAMILIES.medium,
          fontSize: emphasize ? 22 : 16,
          fontWeight: emphasize ? '600' : '500',
          letterSpacing: emphasize ? -0.4 : -0.2,
          lineHeight: emphasize ? 28 : 22,
        },
      }),
    [colors, emphasize],
  );

  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}

/**
 * Full-sheet expense. The name leads the amount panel; category and date are their own panels.
 *
 * @param {object} props
 * @param {{ id: string; name: string; amount: number; chargedOn: string; category?: string } | null} props.expense
 * @param {() => void} props.onRequestClose
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 * @param {boolean} [props.removing]
 */
export function ExpenseDetailSheet({
  expense,
  onRequestClose,
  onEdit,
  onDelete,
  removing = false,
}) {
  const { colors } = useTheme();
  const name = String(expense?.name ?? '').trim();
  const category = expenseCategoryLabel(expense?.category);
  const chargedLabel = formatExpenseDateFieldLabel(expense?.chargedOn);
  const amountLabel = formatExpenseDollars(expense?.amount);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 10,
        },
        lead: {
          gap: 12,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        section: {
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        footer: {
          paddingTop: 4,
        },
        actions: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        actionCol: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      allowBackdropClose
      footer={
        <View style={styles.footer}>
          <View style={styles.actions}>
            <View style={styles.actionCol}>
              <DeleteButton
                disabled={removing}
                loading={removing}
                title="Remove"
                onPress={onDelete}
              />
            </View>
            <View style={styles.actionCol}>
              <Button
                disabled={removing}
                fullWidth
                title="Edit"
                variant="surfaceLight"
                onPress={onEdit}
              />
            </View>
          </View>
        </View>
      }
      liftFooterWithKeyboard={false}
      showCloseButton
      stickyFooter
      title="Expense"
      visible={Boolean(expense)}
      onRequestClose={onRequestClose}
    >
      <View style={styles.stack}>
        <SurfaceCard outlined={false} padding="none" style={[styles.section, styles.lead]}>
          {name ? <AppText style={styles.name}>{name}</AppText> : null}
          <ExpenseDetailField emphasize label="Amount" value={amountLabel} />
        </SurfaceCard>
        <SurfaceCard outlined={false} padding="none" style={styles.section}>
          <ExpenseDetailField label="Category" value={category} />
        </SurfaceCard>
        {chargedLabel ? (
          <SurfaceCard outlined={false} padding="none" style={styles.section}>
            <ExpenseDetailField label="Date" value={chargedLabel} />
          </SurfaceCard>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
