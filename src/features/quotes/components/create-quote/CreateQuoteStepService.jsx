import { DurationSelectField, SurfaceTextField } from '../../../../components/ui';
import {
  QUOTE_PRICE_INPUT_MAX,
  QUOTE_SERVICE_NAME_MAX,
} from '../../constants/createQuoteFieldLimits';
import { CreateQuoteFieldStack } from './CreateQuoteFieldStack';

const FIELD_SHELL = { marginBottom: 0 };
const DURATION_SHELL = { marginBottom: 0, marginTop: 0 };

/** Max chars in the field including `$` (one digit before decimal + cents). */
const PRICE_DISPLAY_MAX = 1 + QUOTE_PRICE_INPUT_MAX;

function normalizePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out.slice(0, QUOTE_PRICE_INPUT_MAX);
}

/**
 * @param {object} props
 * @param {string} props.serviceName
 * @param {(t: string) => void} props.onServiceNameChange
 * @param {string} props.priceUsdText
 * @param {(t: string) => void} props.onPriceUsdTextChange
 * @param {string} props.durationHhMm
 * @param {(t: string) => void} props.onDurationHhMmChange
 */
export function CreateQuoteStepService({
  serviceName,
  onServiceNameChange,
  priceUsdText,
  onPriceUsdTextChange,
  durationHhMm,
  onDurationHhMmChange,
}) {
  return (
    <CreateQuoteFieldStack>
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Service *"
        maxLength={QUOTE_SERVICE_NAME_MAX}
        onChangeText={onServiceNameChange}
        placeholder="e.g. Full interior + exterior"
        value={serviceName}
      />
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        keyboardType="decimal-pad"
        label="Price (USD) *"
        maxLength={PRICE_DISPLAY_MAX}
        onChangeText={(t) => onPriceUsdTextChange(normalizePriceInput(t))}
        placeholder="0.00"
        value={priceUsdText ? `$${priceUsdText}` : ''}
      />
      <DurationSelectField
        containerStyle={DURATION_SHELL}
        label="Duration *"
        mode="service"
        onValueChange={onDurationHhMmChange}
        value={durationHhMm}
      />
    </CreateQuoteFieldStack>
  );
}
