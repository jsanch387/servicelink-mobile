import { supabase } from '../../../lib/supabase';
import { normalizeExpenseCategory } from '../constants/expenseCategories';

const EXPENSE_SELECT = 'id, name, amount_cents, charged_on, category';

/**
 * @param {number} cents
 */
export function expenseCentsToDollars(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

/**
 * @param {number} dollars
 */
export function expenseDollarsToCents(dollars) {
  const n = Number(dollars);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/**
 * @param {{ id: string; name: string; amount_cents: number; charged_on: string; category: string }} row
 */
export function mapExpenseRow(row) {
  return {
    id: row.id,
    name: row.name,
    amount: expenseCentsToDollars(row.amount_cents),
    chargedOn: row.charged_on,
    category: normalizeExpenseCategory(row.category),
  };
}

/**
 * @param {string} businessId
 * @param {{ fromYmd?: string | null; toYmd?: string | null }} [window]
 */
export async function fetchExpensesForBusiness(businessId, window = {}) {
  let query = supabase
    .from('business_expenses')
    .select(EXPENSE_SELECT)
    .eq('business_id', businessId)
    .order('charged_on', { ascending: false });

  if (window.fromYmd) query = query.gte('charged_on', window.fromYmd);
  if (window.toYmd) query = query.lte('charged_on', window.toYmd);

  const { data, error } = await query;
  if (error) {
    return { data: null, error };
  }
  return { data: (data ?? []).map(mapExpenseRow), error: null };
}

/**
 * @param {string} businessId
 * @param {string | null | undefined} userId
 * @param {{ name: string; amount: number; chargedOn: string; category: string }} expense
 */
export async function insertExpenseForBusiness(businessId, userId, expense) {
  const amountCents = expenseDollarsToCents(expense.amount);
  if (amountCents == null || amountCents <= 0) {
    return { data: null, error: new Error('Enter an amount.') };
  }

  const { data, error } = await supabase
    .from('business_expenses')
    .insert({
      business_id: businessId,
      name: expense.name,
      amount_cents: amountCents,
      charged_on: expense.chargedOn,
      category: normalizeExpenseCategory(expense.category),
      created_by: userId ?? null,
    })
    .select(EXPENSE_SELECT)
    .single();

  if (error) return { data: null, error };
  return { data: mapExpenseRow(data), error: null };
}

/**
 * @param {string} expenseId
 * @param {{ name: string; amount: number; chargedOn: string; category: string }} expense
 */
export async function updateExpense(expenseId, expense) {
  const amountCents = expenseDollarsToCents(expense.amount);
  if (amountCents == null || amountCents <= 0) {
    return { data: null, error: new Error('Enter an amount.') };
  }

  const { data, error } = await supabase
    .from('business_expenses')
    .update({
      name: expense.name,
      amount_cents: amountCents,
      charged_on: expense.chargedOn,
      category: normalizeExpenseCategory(expense.category),
    })
    .eq('id', expenseId)
    .select(EXPENSE_SELECT)
    .single();

  if (error) return { data: null, error };
  return { data: mapExpenseRow(data), error: null };
}

/**
 * @param {string} expenseId
 */
export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('business_expenses').delete().eq('id', expenseId);
  return { error };
}
