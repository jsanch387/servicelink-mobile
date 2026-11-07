import { WhiteSegmentedTabs } from '../../../components/ui';
import { PAYMENTS_SCREEN_TAB_OPTIONS } from '../constants/paymentsScreenTabs';

/**
 * Payments screen tabs — white selector segment (distinct from graph range dropdown).
 *
 * @param {{
 *   value: string;
 *   onChange: (id: string) => void;
 * }} props
 */
export function PaymentsScreenTabs({ value, onChange }) {
  return (
    <WhiteSegmentedTabs options={PAYMENTS_SCREEN_TAB_OPTIONS} value={value} onChange={onChange} />
  );
}
