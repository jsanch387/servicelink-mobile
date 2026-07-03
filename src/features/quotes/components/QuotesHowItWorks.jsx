import { useState } from 'react';
import { CatalogHowItWorksLink } from '../../services/components/CatalogHowItWorksLink';
import { QUOTES_HOW_IT_WORKS_LINK_LABEL } from '../constants/quotesHowItWorksCopy';
import { QuotesHowItWorksSheet } from './QuotesHowItWorksSheet';

export function QuotesHowItWorks() {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <CatalogHowItWorksLink
        accessibilityHint="Opens an explanation of how quotes work"
        label={QUOTES_HOW_IT_WORKS_LINK_LABEL}
        onPress={() => setSheetVisible(true)}
      />
      <QuotesHowItWorksSheet visible={sheetVisible} onRequestClose={() => setSheetVisible(false)} />
    </>
  );
}
