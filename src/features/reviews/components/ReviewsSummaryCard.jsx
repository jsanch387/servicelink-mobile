import { SurfaceCard } from '../../../components/ui';
import { ReviewsSummarySection } from './ReviewsSummarySection';

/**
 * @param {{ averageRating: number; totalCount: number; breakdown: { stars: number; percent: number }[] }} props
 */
export function ReviewsSummaryCard({ averageRating, totalCount, breakdown }) {
  return (
    <SurfaceCard padding="md">
      <ReviewsSummarySection
        averageRating={averageRating}
        breakdown={breakdown}
        totalCount={totalCount}
      />
    </SurfaceCard>
  );
}
