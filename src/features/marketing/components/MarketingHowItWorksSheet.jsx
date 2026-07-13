import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import { MARKETING_TAB_PROMOS, MARKETING_TAB_SALES } from '../constants';
import {
  MARKETING_HOW_IT_WORKS_BY_TAB,
  MARKETING_HOW_IT_WORKS_DISMISS_LABEL,
} from '../constants/marketingHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void; isPromosTab: boolean }} props
 */
export function MarketingHowItWorksSheet({ visible, onRequestClose, isPromosTab }) {
  const copy =
    MARKETING_HOW_IT_WORKS_BY_TAB[isPromosTab ? MARKETING_TAB_PROMOS : MARKETING_TAB_SALES];

  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={MARKETING_HOW_IT_WORKS_DISMISS_LABEL}
      intro={copy.intro}
      items={copy.items}
      optionalNote={copy.optionalNote}
      title={copy.title}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
