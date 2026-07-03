import { useState } from 'react';
import { CatalogHowItWorksLink } from '../../services/components/CatalogHowItWorksLink';
import { REVIEWS_HOW_IT_WORKS_LINK_LABEL } from '../constants/reviewsHowItWorksCopy';
import { ReviewsHowItWorksSheet } from './ReviewsHowItWorksSheet';

export function ReviewsHowItWorks() {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <CatalogHowItWorksLink
        accessibilityHint="Opens more information about reviews"
        label={REVIEWS_HOW_IT_WORKS_LINK_LABEL}
        onPress={() => setSheetVisible(true)}
      />
      <ReviewsHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}
