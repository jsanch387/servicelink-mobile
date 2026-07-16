import { RequiredFieldLabel } from '../../../../components/ui';

/**
 * Label + red required asterisk (quote wizard fields).
 * @param {{ text: string; compact?: boolean }} props
 */
export function QuoteRequiredFieldLabel({ text, compact = false }) {
  return <RequiredFieldLabel compact={compact} text={text} />;
}
