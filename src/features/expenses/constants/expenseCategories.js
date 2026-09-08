export const EXPENSE_CATEGORY = {
  SUPPLIES: 'supplies',
  FUEL: 'fuel',
  INSURANCE: 'insurance',
  EQUIPMENT: 'equipment',
  OTHER: 'other',
};

export const EXPENSE_CATEGORY_OPTIONS = [
  { key: EXPENSE_CATEGORY.SUPPLIES, label: 'Supplies' },
  { key: EXPENSE_CATEGORY.FUEL, label: 'Fuel' },
  { key: EXPENSE_CATEGORY.INSURANCE, label: 'Insurance' },
  { key: EXPENSE_CATEGORY.EQUIPMENT, label: 'Equipment' },
  { key: EXPENSE_CATEGORY.OTHER, label: 'Other' },
];

export const EXPENSE_CATEGORY_DEFAULT = EXPENSE_CATEGORY.OTHER;

export function expenseCategoryLabel(key) {
  return EXPENSE_CATEGORY_OPTIONS.find((option) => option.key === key)?.label ?? 'Other';
}

export function normalizeExpenseCategory(key) {
  if (EXPENSE_CATEGORY_OPTIONS.some((option) => option.key === key)) return key;
  return EXPENSE_CATEGORY_DEFAULT;
}
