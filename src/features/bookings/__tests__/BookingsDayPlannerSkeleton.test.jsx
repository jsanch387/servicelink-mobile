import { screen } from '@testing-library/react-native';
import { BookingsDayPlannerSkeleton } from '../components/BookingsDayPlannerSkeleton';
import { renderWithProviders } from '../../home/__tests__/testUtils';

describe('BookingsDayPlannerSkeleton', () => {
  it('shows a day planner loading state instead of list cards', () => {
    renderWithProviders(<BookingsDayPlannerSkeleton />);

    expect(screen.getByLabelText('Loading day planner')).toBeTruthy();
    expect(screen.getAllByText('5:00').length).toBeGreaterThan(0);
  });
});
