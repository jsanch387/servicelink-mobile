import { CustomJobFields } from '../../../../components/ui';
import {
  QUOTE_PRICE_INPUT_MAX,
  QUOTE_SERVICE_NAME_MAX,
} from '../../constants/createQuoteFieldLimits';

/**
 * Custom job details: name, price, and duration.
 *
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
    <CustomJobFields
      durationHhMm={durationHhMm}
      priceInputMaxLength={QUOTE_PRICE_INPUT_MAX}
      priceUsdText={priceUsdText}
      serviceName={serviceName}
      serviceNameMaxLength={QUOTE_SERVICE_NAME_MAX}
      onDurationHhMmChange={onDurationHhMmChange}
      onPriceUsdTextChange={onPriceUsdTextChange}
      onServiceNameChange={onServiceNameChange}
    />
  );
}
