import { useState } from 'react';
import { CatalogHowItWorksLink } from '../../services/components/CatalogHowItWorksLink';
import { MAINTENANCE_HOW_IT_WORKS_LINK_LABEL } from '../constants/maintenanceHowItWorksCopy';
import { MaintenanceHowItWorksSheet } from './MaintenanceHowItWorksSheet';

export function MaintenanceHowItWorks() {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <CatalogHowItWorksLink
        accessibilityHint="Opens an explanation of how maintenance works"
        label={MAINTENANCE_HOW_IT_WORKS_LINK_LABEL}
        onPress={() => setSheetVisible(true)}
      />
      <MaintenanceHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}
