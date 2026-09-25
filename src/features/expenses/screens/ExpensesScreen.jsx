import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  customDateWindow,
  InlineCardError,
  isCompleteCustomDateRange,
  SegmentedToggle,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { AddExpenseFab } from '../components/AddExpenseFab';
import { ExpenseDetailSheet } from '../components/ExpenseDetailSheet';
import { ExpenseEditorSheet } from '../components/ExpenseEditorSheet';
import { ExpenseInsights } from '../components/ExpenseInsights';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseListSkeleton } from '../components/ExpenseListSkeleton';
import { ExpenseOverviewSkeleton } from '../components/ExpenseOverviewSkeleton';
import { EXPENSE_CATEGORY_DEFAULT } from '../constants/expenseCategories';
import { EXPENSE_RANGE, EXPENSE_RANGE_DEFAULT } from '../constants/expenseRanges';
import { EXPENSE_SCREEN_TAB, EXPENSE_SCREEN_TAB_OPTIONS } from '../constants/expenseScreenTabs';
import { useExpensesList } from '../hooks/useExpensesList';
import { useExpensesOverview } from '../hooks/useExpensesOverview';
import { useExpenseWrites } from '../hooks/useExpenseWrites';
import { summarizeExpenseOutflow } from '../utils/summarizeExpenseOutflow';

export function ExpensesScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [screenTab, setScreenTab] = useState(EXPENSE_SCREEN_TAB.OVERVIEW);
  const [range, setRange] = useState(EXPENSE_RANGE_DEFAULT);
  const [customFromYmd, setCustomFromYmd] = useState(/** @type {string | null} */ (null));
  const [customToYmd, setCustomToYmd] = useState(/** @type {string | null} */ (null));
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(
    /** @type {{ id: string; name: string; amount: number; chargedOn: string; category?: string } | null} */ (
      null
    ),
  );
  const [viewingExpense, setViewingExpense] = useState(
    /** @type {{ id: string; name: string; amount: number; chargedOn: string; category?: string } | null} */ (
      null
    ),
  );
  const editHandoffRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const showOverview = screenTab === EXPENSE_SCREEN_TAB.OVERVIEW;
  const overview = useExpensesOverview({
    range,
    customFromYmd,
    customToYmd,
    enabled: showOverview,
  });
  const list = useExpensesList({ enabled: !showOverview });
  const { save, remove } = useExpenseWrites();

  const selectCustomRange = useCallback(({ fromYmd, toYmd }) => {
    const next = customDateWindow(fromYmd, toYmd);
    if (!isCompleteCustomDateRange(next.fromYmd, next.toYmd)) return;
    setCustomFromYmd(next.fromYmd);
    setCustomToYmd(next.toYmd);
    setRange(EXPENSE_RANGE.CUSTOM);
  }, []);

  const outflow = useMemo(
    () =>
      summarizeExpenseOutflow(overview.expenses, range, new Date(), {
        customFromYmd,
        customToYmd,
      }),
    [customFromYmd, customToYmd, overview.expenses, range],
  );

  useEffect(
    () => () => {
      if (editHandoffRef.current) clearTimeout(editHandoffRef.current);
    },
    [],
  );

  const openNew = useCallback(() => {
    if (editHandoffRef.current) {
      clearTimeout(editHandoffRef.current);
      editHandoffRef.current = null;
    }
    setViewingExpense(null);
    setEditingExpense(null);
    setEditorVisible(true);
  }, []);

  const openExpense = useCallback((expense) => {
    setViewingExpense(expense);
  }, []);

  const closeExpense = useCallback(() => {
    setViewingExpense(null);
  }, []);

  const editExpense = useCallback(() => {
    const expense = viewingExpense;
    if (!expense) return;
    setViewingExpense(null);
    if (editHandoffRef.current) clearTimeout(editHandoffRef.current);
    editHandoffRef.current = setTimeout(() => {
      editHandoffRef.current = null;
      setEditingExpense(expense);
      setEditorVisible(true);
    }, 320);
  }, [viewingExpense]);

  const closeEditor = useCallback(() => {
    setEditorVisible(false);
    setEditingExpense(null);
  }, []);

  const handleSave = useCallback(
    async ({ name, amount, chargedOn, category }) => {
      try {
        await save.mutateAsync({
          id: editingExpense?.id,
          name,
          amount,
          chargedOn,
          category: category ?? EXPENSE_CATEGORY_DEFAULT,
        });
        closeEditor();
      } catch (error) {
        Alert.alert(
          'Could not save expense',
          error instanceof Error ? error.message : 'Try again.',
        );
      }
    },
    [closeEditor, editingExpense, save],
  );

  const handleDelete = useCallback(() => {
    if (!viewingExpense?.id) return;
    const label = viewingExpense.name;
    const expenseId = viewingExpense.id;
    Alert.alert('Remove expense?', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(expenseId).then(
            () => {
              setViewingExpense(null);
            },
            (error) => {
              Alert.alert(
                'Could not remove expense',
                error instanceof Error ? error.message : 'Try again.',
              );
            },
          );
        },
      },
    ]);
  }, [remove, viewingExpense]);

  const activeError = showOverview ? overview.error : list.error;
  const activeLoading = showOverview ? overview.isLoading : list.isLoading;
  const isEmpty = showOverview ? outflow.total <= 0 : list.expenses.length === 0;

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
        emptyPage: {
          flex: 1,
          paddingBottom: 24,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        error: {
          marginBottom: 16,
        },
      }),
    [colors, tabBarHeight],
  );

  const pageBody = (
    <>
      <SegmentedToggle
        options={EXPENSE_SCREEN_TAB_OPTIONS}
        selected={screenTab}
        onSelect={setScreenTab}
      />

      {activeError ? (
        <View style={styles.error}>
          <InlineCardError message={activeError} />
        </View>
      ) : null}

      {activeLoading ? (
        showOverview ? (
          <ExpenseOverviewSkeleton />
        ) : (
          <ExpenseListSkeleton />
        )
      ) : showOverview ? (
        <ExpenseInsights
          customFromYmd={customFromYmd}
          customToYmd={customToYmd}
          outflow={outflow}
          range={range}
          onRangeChange={setRange}
          onSelectCustom={selectCustomRange}
        />
      ) : (
          <ExpenseList
            expenses={list.expenses}
            hasNextPage={list.hasNextPage}
            isFetchingNextPage={list.isFetchingNextPage}
            onExpensePress={openExpense}
            onLoadMore={() => {
              void list.fetchNextPage();
            }}
          />
      )}
    </>
  );

  return (
    <View style={styles.root}>
      {isEmpty && !activeLoading ? (
        <View style={styles.emptyPage}>{pageBody}</View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {pageBody}
        </ScrollView>
      )}

      <AddExpenseFab onPress={openNew} />

      <ExpenseDetailSheet
        expense={viewingExpense}
        removing={remove.isPending}
        onDelete={handleDelete}
        onEdit={editExpense}
        onRequestClose={closeExpense}
      />

      <ExpenseEditorSheet
        expense={editingExpense}
        saving={save.isPending}
        visible={editorVisible}
        onRequestClose={closeEditor}
        onSave={handleSave}
      />
    </View>
  );
}
