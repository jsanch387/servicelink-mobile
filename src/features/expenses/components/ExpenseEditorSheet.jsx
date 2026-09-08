import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DeleteButton,
  FormBottomSheetModal,
  SurfaceTextField,
  WizardStepHeader,
  toLocalYyyyMmDd,
} from '../../../components/ui';
import { EXPENSE_CATEGORY_DEFAULT, normalizeExpenseCategory } from '../constants/expenseCategories';
import { EXPENSE_NAME_MAX_LENGTH, sanitizeExpenseNameInput } from '../utils/expenseName';
import { parseExpenseAmount, sanitizeExpenseAmountInput } from '../utils/expenseMoney';
import { ExpenseCategoryChips } from './ExpenseCategoryChips';
import { ExpenseDateField } from './ExpenseDateField';

const STEP_AMOUNT = 0;
const STEP_NAME = 1;
const STEP_DATE = 2;
const STEP_COUNT = 3;

const STEPS = [
  { title: 'Amount', subtitle: 'What left the business.' },
  { title: 'Details', subtitle: 'A name and category for your books.' },
  { title: 'Date', subtitle: 'The day it was charged.' },
];

/**
 * Add or edit a single expense: amount → name + category → date.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {{ id: string; name: string; amount: number; chargedOn: string } | null} [props.expense]
 * @param {() => void} props.onRequestClose
 * @param {(next: { name: string; amount: number; chargedOn: string; category: string }) => void} props.onSave
 * @param {() => void} [props.onDelete]
 */
export function ExpenseEditorSheet({ visible, expense = null, onRequestClose, onSave, onDelete }) {
  const isEdit = Boolean(expense?.id);
  const [step, setStep] = useState(STEP_AMOUNT);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [chargedOn, setChargedOn] = useState(toLocalYyyyMmDd(new Date()));
  const [category, setCategory] = useState(EXPENSE_CATEGORY_DEFAULT);

  useEffect(() => {
    if (!visible) return;
    setStep(STEP_AMOUNT);
    setName(sanitizeExpenseNameInput(expense?.name ?? ''));
    setAmountText(
      expense?.amount != null && Number.isFinite(Number(expense.amount))
        ? String(expense.amount)
        : '',
    );
    setChargedOn(expense?.chargedOn || toLocalYyyyMmDd(new Date()));
    setCategory(normalizeExpenseCategory(expense?.category));
  }, [visible, expense]);

  const amount = parseExpenseAmount(amountText);
  const isLast = step === STEP_DATE;
  const stepMeta = STEPS[step] ?? STEPS[0];
  const canAdvance =
    step === STEP_AMOUNT
      ? amount != null
      : step === STEP_NAME
        ? name.trim().length > 0
        : Boolean(chargedOn);

  function handleSecondary() {
    if (step === STEP_AMOUNT) {
      onRequestClose();
      return;
    }
    setStep((current) => Math.max(STEP_AMOUNT, current - 1));
  }

  function handlePrimary() {
    if (!canAdvance) return;
    if (!isLast) {
      setStep((current) => Math.min(STEP_DATE, current + 1));
      return;
    }
    onSave({
      name: sanitizeExpenseNameInput(name).trim(),
      amount,
      chargedOn,
      category,
    });
  }

  return (
    <FormBottomSheetModal
      cancelTitle={step === STEP_AMOUNT ? 'Cancel' : 'Back'}
      primaryDisabled={!canAdvance}
      primaryTitle={isLast ? (isEdit ? 'Save' : 'Done') : 'Continue'}
      showHeaderDivider={false}
      title={isEdit ? 'Expense' : 'New expense'}
      visible={visible}
      onPrimaryPress={handlePrimary}
      onRequestClose={onRequestClose}
      onSecondaryPress={handleSecondary}
    >
      <WizardStepHeader
        compactCopy
        embedded
        progressAccessibilityLabel={isEdit ? 'Edit expense progress' : 'New expense progress'}
        stepCount={STEP_COUNT}
        stepIndex={step}
        style={styles.header}
        subtitle={stepMeta.subtitle}
        title={stepMeta.title}
      />

      {step === STEP_AMOUNT ? (
        <SurfaceTextField
          autoFocus
          compact
          containerStyle={styles.field}
          keyboardType="decimal-pad"
          placeholder="0"
          prefixText="$"
          value={amountText}
          onChangeText={(text) => setAmountText(sanitizeExpenseAmountInput(text))}
        />
      ) : null}

      {step === STEP_NAME ? (
        <View style={styles.nameStack}>
          <SurfaceTextField
            autoCapitalize="words"
            autoFocus
            compact
            containerStyle={styles.field}
            label="Name"
            maxLength={EXPENSE_NAME_MAX_LENGTH}
            placeholder="Home Depot supplies"
            value={name}
            onChangeText={(text) => setName(sanitizeExpenseNameInput(text))}
          />
          <ExpenseCategoryChips value={category} onChange={setCategory} />
        </View>
      ) : null}

      {step === STEP_DATE ? (
        <View>
          <ExpenseDateField valueYyyyMmDd={chargedOn} onChange={setChargedOn} />
          {isEdit && onDelete ? (
            <View style={styles.deleteWrap}>
              <DeleteButton title="Remove expense" onPress={onDelete} />
            </View>
          ) : null}
        </View>
      ) : null}
    </FormBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 20,
    paddingTop: 2,
  },
  field: {
    marginBottom: 0,
    marginTop: 0,
  },
  nameStack: {
    gap: 24,
  },
  deleteWrap: {
    marginTop: 24,
  },
});
