import { supabase } from '../../../lib/supabase';
import { normalizeExpenseCategory } from '../constants/expenseCategories';
import { expenseMonthBounds } from '../utils/expenseDate';

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
 * One calendar month of the register, newest month first.
 * `beforeYmd` skips that date and anything newer, so the next page is the previous month that has a charge.
 *
 * @param {string} businessId
 * @param {string | null} [beforeYmd]
 * @returns {Promise<{ data: { expenses: ReturnType<typeof mapExpenseRow>[]; monthKey: string | null; hasOlder: boolean } | null; error: unknown }>}
 */
export async function fetchExpenseMonthPage(businessId, beforeYmd = null) {
  let probe = supabase
    .from('business_expenses')
    .select('charged_on')
    .eq('business_id', businessId)
    .order('charged_on', { ascending: false })
    .limit(1);

  if (beforeYmd) probe = probe.lt('charged_on', beforeYmd);

  const { data: probeRows, error: probeError } = await probe;
  if (probeError) return { data: null, error: probeError };

  const anchor = probeRows?.[0]?.charged_on ?? null;
  const bounds = expenseMonthBounds(anchor);
  if (!bounds) {
    return { data: { expenses: [], monthKey: null, hasOlder: false }, error: null };
  }

  const monthQuery = supabase
    .from('business_expenses')
    .select(EXPENSE_SELECT)
    .eq('business_id', businessId)
    .gte('charged_on', bounds.fromYmd)
    .lte('charged_on', bounds.toYmd)
    .order('charged_on', { ascending: false })
    .order('id', { ascending: false });

  const olderQuery = supabase
    .from('business_expenses')
    .select('id')
    .eq('business_id', businessId)
    .lt('charged_on', bounds.fromYmd)
    .limit(1);

  const [monthResult, olderResult] = await Promise.all([monthQuery, olderQuery]);
  if (monthResult.error) return { data: null, error: monthResult.error };
  if (olderResult.error) return { data: null, error: olderResult.error };

  return {
    data: {
      expenses: (monthResult.data ?? []).map(mapExpenseRow),
      monthKey: bounds.monthKey,
      hasOlder: (olderResult.data ?? []).length > 0,
    },
    error: null,
  };
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
