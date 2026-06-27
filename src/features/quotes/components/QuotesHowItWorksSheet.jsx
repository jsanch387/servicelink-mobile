import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import {
  QUOTES_HOW_IT_WORKS_DISMISS_LABEL,
  QUOTES_HOW_IT_WORKS_INTRO,
  QUOTES_HOW_IT_WORKS_ITEMS,
  QUOTES_HOW_IT_WORKS_OPTIONAL_NOTE,
  QUOTES_HOW_IT_WORKS_TITLE,
} from '../constants/quotesHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function QuotesHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={QUOTES_HOW_IT_WORKS_DISMISS_LABEL}
      intro={QUOTES_HOW_IT_WORKS_INTRO}
      items={QUOTES_HOW_IT_WORKS_ITEMS}
      optionalNote={QUOTES_HOW_IT_WORKS_OPTIONAL_NOTE}
      title={QUOTES_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
