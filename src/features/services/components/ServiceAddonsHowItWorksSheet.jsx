import { CatalogFeatureHowItWorksSheet } from './CatalogFeatureHowItWorksSheet';
import {
  SERVICE_ADDONS_HOW_IT_WORKS_DISMISS_LABEL,
  SERVICE_ADDONS_HOW_IT_WORKS_INTRO,
  SERVICE_ADDONS_HOW_IT_WORKS_ITEMS,
  SERVICE_ADDONS_HOW_IT_WORKS_OPTIONAL_NOTE,
  SERVICE_ADDONS_HOW_IT_WORKS_TITLE,
} from '../constants/serviceAddonsHowItWorksCopy';

export function ServiceAddonsHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={SERVICE_ADDONS_HOW_IT_WORKS_DISMISS_LABEL}
      intro={SERVICE_ADDONS_HOW_IT_WORKS_INTRO}
      items={SERVICE_ADDONS_HOW_IT_WORKS_ITEMS}
      optionalNote={SERVICE_ADDONS_HOW_IT_WORKS_OPTIONAL_NOTE}
      title={SERVICE_ADDONS_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
