import { View } from 'react-native';
import { CustomJobFields } from '../../../../components/ui';
import {
  QUOTE_PRICE_INPUT_MAX,
  QUOTE_SERVICE_NAME_MAX,
} from '../../constants/createQuoteFieldLimits';
import { formatQuoteMoney } from '../../utils/quotePresentation';
import { buildQuoteTaxPreview, quotePriceTextToCents } from '../../utils/quoteTaxPreview';
import { QuoteTaxTotalBlock } from '../QuoteAmountRow';

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
 * @param {boolean} [props.taxEnabled]
 * @param {number | null} [props.taxRateBps]
 */
export function CreateQuoteStepService({
  serviceName,
  onServiceNameChange,
  priceUsdText,
  onPriceUsdTextChange,
  durationHhMm,
  onDurationHhMmChange,
  taxEnabled = false,
  taxRateBps = null,
}) {
  const taxPreview = buildQuoteTaxPreview({
    priceCents: quotePriceTextToCents(priceUsdText),
    taxEnabled,
    taxRateBps,
  });

  return (
    <View>
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
      {taxPreview.taxCents > 0 ? (
        <QuoteTaxTotalBlock
          priceValue={formatQuoteMoney(taxPreview.priceCents)}
          taxLabel={taxPreview.label}
          taxValue={formatQuoteMoney(taxPreview.taxCents)}
          totalValue={formatQuoteMoney(taxPreview.customerPaysCents)}
        />
      ) : null}
    </View>
  );
}
