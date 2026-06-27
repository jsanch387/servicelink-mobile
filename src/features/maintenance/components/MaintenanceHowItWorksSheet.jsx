import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import {
  MAINTENANCE_HOW_IT_WORKS_DISMISS_LABEL,
  MAINTENANCE_HOW_IT_WORKS_INTRO,
  MAINTENANCE_HOW_IT_WORKS_ITEMS,
  MAINTENANCE_HOW_IT_WORKS_OPTIONAL_NOTE,
  MAINTENANCE_HOW_IT_WORKS_TITLE,
} from '../constants/maintenanceHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function MaintenanceHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={MAINTENANCE_HOW_IT_WORKS_DISMISS_LABEL}
      intro={MAINTENANCE_HOW_IT_WORKS_INTRO}
      items={MAINTENANCE_HOW_IT_WORKS_ITEMS}
      optionalNote={MAINTENANCE_HOW_IT_WORKS_OPTIONAL_NOTE}
      title={MAINTENANCE_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
