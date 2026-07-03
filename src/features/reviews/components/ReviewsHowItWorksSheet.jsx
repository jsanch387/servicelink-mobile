import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import {
  REVIEWS_HOW_IT_WORKS_DISMISS_LABEL,
  REVIEWS_HOW_IT_WORKS_INTRO,
  REVIEWS_HOW_IT_WORKS_ITEMS,
  REVIEWS_HOW_IT_WORKS_OPTIONAL_NOTE,
  REVIEWS_HOW_IT_WORKS_TITLE,
} from '../constants/reviewsHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function ReviewsHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={REVIEWS_HOW_IT_WORKS_DISMISS_LABEL}
      intro={REVIEWS_HOW_IT_WORKS_INTRO}
      items={REVIEWS_HOW_IT_WORKS_ITEMS}
      optionalNote={REVIEWS_HOW_IT_WORKS_OPTIONAL_NOTE}
      title={REVIEWS_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
