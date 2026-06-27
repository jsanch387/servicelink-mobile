import { CatalogFeatureHowItWorksSheet } from '../../components/CatalogFeatureHowItWorksSheet';
import {
  SERVICE_CATEGORIES_HOW_IT_WORKS_DISMISS_LABEL,
  SERVICE_CATEGORIES_HOW_IT_WORKS_INTRO,
  SERVICE_CATEGORIES_HOW_IT_WORKS_ITEMS,
  SERVICE_CATEGORIES_HOW_IT_WORKS_OPTIONAL_NOTE,
  SERVICE_CATEGORIES_HOW_IT_WORKS_TITLE,
} from '../constants/serviceCategoriesHowItWorksCopy';

export function ServiceCategoriesHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={SERVICE_CATEGORIES_HOW_IT_WORKS_DISMISS_LABEL}
      intro={SERVICE_CATEGORIES_HOW_IT_WORKS_INTRO}
      items={SERVICE_CATEGORIES_HOW_IT_WORKS_ITEMS}
      optionalNote={SERVICE_CATEGORIES_HOW_IT_WORKS_OPTIONAL_NOTE}
      title={SERVICE_CATEGORIES_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
