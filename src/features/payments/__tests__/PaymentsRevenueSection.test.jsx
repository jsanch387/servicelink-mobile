import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { REVENUE_EMPTY_CAPTION } from '../constants/paymentsRevenueRanges';
import { PaymentsRevenueSection } from '../components/PaymentsRevenueSection';

const mockUsePaymentsRevenue = jest.fn();

jest.mock('../hooks/usePaymentsRevenue', () => ({
  usePaymentsRevenue: (...args) => mockUsePaymentsRevenue(...args),
}));

function emptySummary(overrides = {}) {
  return {
    range: 'month',
    setRange: jest.fn(),
    summary: {
      collectedCents: 0,
      jobsPaid: 0,
      changePct: null,
      compareLabel: null,
      bars: [
        { key: 'w1', label: 'Wk 1', fullLabel: 'Week 1', cents: 0 },
        { key: 'w2', label: 'Wk 2', fullLabel: 'Week 2', cents: 0 },
      ],
    },
    isPending: false,
    isError: false,
    errorMessage: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

describe('PaymentsRevenueSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign-in hint when businessId is missing', () => {
    mockUsePaymentsRevenue.mockReturnValue(emptySummary());
    renderWithProviders(<PaymentsRevenueSection businessId={null} />);
    expect(screen.getByText('Sign in to see revenue from completed jobs.')).toBeTruthy();
  });

  it('shows $0, quiet empty caption, and zero jobs when nothing is completed', () => {
    mockUsePaymentsRevenue.mockReturnValue(emptySummary());
    renderWithProviders(<PaymentsRevenueSection businessId="biz-1" />);

    expect(screen.getAllByText('$0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(REVENUE_EMPTY_CAPTION)).toBeTruthy();
    expect(screen.getByText('Jobs paid')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText(/No completed jobs/i)).toBeNull();
  });

  it('shows collected amount, change pill, and jobs when there is revenue', () => {
    mockUsePaymentsRevenue.mockReturnValue(
      emptySummary({
        summary: {
          collectedCents: 125000,
          jobsPaid: 4,
          changePct: 20,
          compareLabel: 'vs last month',
          bars: [
            { key: 'w1', label: 'Wk 1', fullLabel: 'Week 1', cents: 50000 },
            { key: 'w2', label: 'Wk 2', fullLabel: 'Week 2', cents: 75000 },
          ],
        },
      }),
    );

    renderWithProviders(<PaymentsRevenueSection businessId="biz-1" />);

    expect(screen.getByText('$1,250')).toBeTruthy();
    expect(screen.getByText(/20% vs last month/)).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.queryByText(REVENUE_EMPTY_CAPTION)).toBeNull();
  });

  it('surfaces load errors without hiding the chart stack', () => {
    mockUsePaymentsRevenue.mockReturnValue(
      emptySummary({
        isError: true,
        errorMessage: 'Could not load revenue',
        summary: {
          collectedCents: 0,
          jobsPaid: 0,
          changePct: null,
          compareLabel: null,
          bars: [{ key: 'w1', label: 'Wk 1', fullLabel: 'Week 1', cents: 0 }],
        },
      }),
    );

    renderWithProviders(<PaymentsRevenueSection businessId="biz-1" />);
    expect(screen.getByText('Could not load revenue')).toBeTruthy();
  });
});
