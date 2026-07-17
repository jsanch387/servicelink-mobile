import { screen } from '@testing-library/react-native';
import { TodaysPotentialCard } from '../components/TodaysPotentialCard';
import { renderWithProviders } from './testUtils';

describe('TodaysPotentialCard', () => {
  it('shows a stable loading skeleton without placeholder money', () => {
    renderWithProviders(<TodaysPotentialCard isLoading />);

    expect(screen.getByLabelText("Loading today's earnings")).toBeTruthy();
    expect(screen.queryByText('$0')).toBeNull();
  });

  it('shows the revenue and payment summary', () => {
    renderWithProviders(<TodaysPotentialCard collectedCents={32000} potentialCents={68000} />);

    expect(screen.getByText('$680')).toBeTruthy();
    expect(screen.getByText('$320')).toBeTruthy();
    expect(screen.getByText('$360')).toBeTruthy();
  });

  it('shows the remaining potential', () => {
    renderWithProviders(<TodaysPotentialCard collectedCents={0} potentialCents={12500} />);

    expect(screen.getAllByText('$125')).toHaveLength(2);
  });
});
