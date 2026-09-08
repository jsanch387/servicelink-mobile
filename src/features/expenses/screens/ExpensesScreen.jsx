import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  customDateWindow,
  isCompleteCustomDateRange,
  SegmentedToggle,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { AddExpenseFab } from '../components/AddExpenseFab';
import { ExpenseEditorSheet } from '../components/ExpenseEditorSheet';
import { ExpenseInsights } from '../components/ExpenseInsights';
import { ExpenseList } from '../components/ExpenseList';
import { EXPENSE_CATEGORY_DEFAULT } from '../constants/expenseCategories';
import { EXPENSE_RANGE, EXPENSE_RANGE_DEFAULT } from '../constants/expenseRanges';
import { EXPENSE_SCREEN_TAB, EXPENSE_SCREEN_TAB_OPTIONS } from '../constants/expenseScreenTabs';
import { MOCK_EXPENSES } from '../constants/mockExpenses';
import { mockRevenueForRange } from '../constants/mockRevenue';
import { summarizeExpenseOutflow } from '../utils/summarizeExpenseOutflow';

function createExpenseId() {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ExpensesScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [screenTab, setScreenTab] = useState(EXPENSE_SCREEN_TAB.OVERVIEW);
  const [range, setRange] = useState(EXPENSE_RANGE_DEFAULT);
  const [customFromYmd, setCustomFromYmd] = useState(/** @type {string | null} */ (null));
  const [customToYmd, setCustomToYmd] = useState(/** @type {string | null} */ (null));
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(
    /** @type {typeof MOCK_EXPENSES[0] | null} */ (null),
  );

  const selectCustomRange = useCallback(({ fromYmd, toYmd }) => {
    const next = customDateWindow(fromYmd, toYmd);
    if (!isCompleteCustomDateRange(next.fromYmd, next.toYmd)) return;
    setCustomFromYmd(next.fromYmd);
    setCustomToYmd(next.toYmd);
    setRange(EXPENSE_RANGE.CUSTOM);
  }, []);

  const outflow = useMemo(
    () =>
      summarizeExpenseOutflow(expenses, range, new Date(), {
        revenueDollars: mockRevenueForRange(range, { fromYmd: customFromYmd, toYmd: customToYmd }),
        customFromYmd,
        customToYmd,
      }),
    [customFromYmd, customToYmd, expenses, range],
  );
  const showOverview = screenTab === EXPENSE_SCREEN_TAB.OVERVIEW;

  const openNew = useCallback(() => {
    setEditingExpense(null);
    setEditorVisible(true);
  }, []);

  const openEdit = useCallback((expense) => {
    setEditingExpense(expense);
    setEditorVisible(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorVisible(false);
    setEditingExpense(null);
  }, []);

  const handleSave = useCallback(
    ({ name, amount, chargedOn, category }) => {
      setExpenses((current) => {
        if (editingExpense?.id) {
          return current.map((item) =>
            item.id === editingExpense.id
              ? { ...item, name, amount, chargedOn, category: category ?? EXPENSE_CATEGORY_DEFAULT }
              : item,
          );
        }
        return [
          {
            id: createExpenseId(),
            name,
            amount,
            chargedOn,
            category: category ?? EXPENSE_CATEGORY_DEFAULT,
          },
          ...current,
        ];
      });
      closeEditor();
    },
    [closeEditor, editingExpense],
  );

  const handleDelete = useCallback(() => {
    if (!editingExpense?.id) return;
    const label = editingExpense.name;
    Alert.alert('Remove expense?', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setExpenses((current) => current.filter((item) => item.id !== editingExpense.id));
          closeEditor();
        },
      },
    ]);
  }, [closeEditor, editingExpense]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          position: 'relative',
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: 112 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
      }),
    [colors, tabBarHeight],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SegmentedToggle
          options={EXPENSE_SCREEN_TAB_OPTIONS}
          selected={screenTab}
          onSelect={setScreenTab}
        />

        {showOverview ? (
          <ExpenseInsights
            customFromYmd={customFromYmd}
            customToYmd={customToYmd}
            outflow={outflow}
            range={range}
            onRangeChange={setRange}
            onSelectCustom={selectCustomRange}
          />
        ) : (
          <ExpenseList expenses={expenses} onExpensePress={openEdit} />
        )}
      </ScrollView>

      <AddExpenseFab onPress={openNew} />

      <ExpenseEditorSheet
        expense={editingExpense}
        visible={editorVisible}
        onDelete={editingExpense ? handleDelete : undefined}
        onRequestClose={closeEditor}
        onSave={handleSave}
      />
    </View>
  );
}
