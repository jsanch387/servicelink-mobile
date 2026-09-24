import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import {
  TEAM_HOW_IT_WORKS_DISMISS_LABEL,
  TEAM_HOW_IT_WORKS_INTRO,
  TEAM_HOW_IT_WORKS_ITEMS,
  TEAM_HOW_IT_WORKS_TITLE,
} from '../constants/teamHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function TeamHowItWorksSheet({ visible, onRequestClose }) {
  return (
    <CatalogFeatureHowItWorksSheet
      dismissLabel={TEAM_HOW_IT_WORKS_DISMISS_LABEL}
      intro={TEAM_HOW_IT_WORKS_INTRO}
      items={TEAM_HOW_IT_WORKS_ITEMS}
      title={TEAM_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
