import { TimeRangePicker } from '../../../components/ui';
import { REVENUE_RANGE, REVENUE_RANGE_OPTIONS } from '../constants/paymentsRevenueRanges';

const RANGE_OPTIONS = REVENUE_RANGE_OPTIONS.map((opt) => ({
  key: opt.id,
  label: opt.label,
}));

/**
 * Payments revenue time range — shared `TimeRangePicker` with Custom dates.
 *
 * @param {{
 *   value: string;
 *   customFromYmd?: string | null;
 *   customToYmd?: string | null;
 *   onChange: (id: string) => void;
 *   onSelectCustom: (next: { fromYmd: string; toYmd: string }) => void;
 * }} props
 */
export function PaymentsRevenueRangePicker({
  value,
  customFromYmd = null,
  customToYmd = null,
  onChange,
  onSelectCustom,
}) {
  return (
    <TimeRangePicker
      customFromYmd={customFromYmd}
      customKey={REVENUE_RANGE.CUSTOM}
      customToYmd={customToYmd}
      options={RANGE_OPTIONS}
      value={value}
      onChange={onChange}
      onSelectCustom={onSelectCustom}
    />
  );
}
