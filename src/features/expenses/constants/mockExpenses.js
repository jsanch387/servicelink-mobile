import { toLocalYyyyMmDd } from '../../../components/ui';
import { EXPENSE_CATEGORY } from './expenseCategories';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalYyyyMmDd(date);
}

/** Local-only seed data for the expenses UI — a typical detailing shop. */
export const MOCK_EXPENSES = [
  {
    id: 'exp_1',
    name: 'Home Depot supplies',
    amount: 48.27,
    chargedOn: daysAgo(0),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  { id: 'exp_2', name: 'Gas', amount: 72, chargedOn: daysAgo(1), category: EXPENSE_CATEGORY.FUEL },
  {
    id: 'exp_3',
    name: 'Chemical Guys refill',
    amount: 64.5,
    chargedOn: daysAgo(3),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  {
    id: 'exp_4',
    name: 'Truck wash',
    amount: 25,
    chargedOn: daysAgo(4),
    category: EXPENSE_CATEGORY.OTHER,
  },
  {
    id: 'exp_5',
    name: 'Microfiber towels',
    amount: 38,
    chargedOn: daysAgo(6),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  {
    id: 'exp_6',
    name: 'Phone bill',
    amount: 89.99,
    chargedOn: daysAgo(12),
    category: EXPENSE_CATEGORY.OTHER,
  },
  { id: 'exp_7', name: 'Gas', amount: 68, chargedOn: daysAgo(18), category: EXPENSE_CATEGORY.FUEL },
  {
    id: 'exp_8',
    name: 'Polisher pad set',
    amount: 54,
    chargedOn: daysAgo(22),
    category: EXPENSE_CATEGORY.EQUIPMENT,
  },
  {
    id: 'exp_9',
    name: 'Business insurance',
    amount: 186,
    chargedOn: daysAgo(28),
    category: EXPENSE_CATEGORY.INSURANCE,
  },
  {
    id: 'exp_10',
    name: "Meguiar's compound",
    amount: 52,
    chargedOn: daysAgo(32),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  {
    id: 'exp_11',
    name: 'Shop towels',
    amount: 19,
    chargedOn: daysAgo(45),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  {
    id: 'exp_12',
    name: 'Gas',
    amount: 61,
    chargedOn: daysAgo(58),
    category: EXPENSE_CATEGORY.FUEL,
  },
  {
    id: 'exp_13',
    name: 'Buffer polish',
    amount: 44,
    chargedOn: daysAgo(70),
    category: EXPENSE_CATEGORY.SUPPLIES,
  },
  {
    id: 'exp_14',
    name: 'Rotary buffer',
    amount: 220,
    chargedOn: '2025-11-12',
    category: EXPENSE_CATEGORY.EQUIPMENT,
  },
  {
    id: 'exp_15',
    name: 'Business insurance',
    amount: 174,
    chargedOn: '2025-06-03',
    category: EXPENSE_CATEGORY.INSURANCE,
  },
];
