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
    customFromYmd: null,
    customToYmd: null,
    fromYmd: '2026-07-01',
    toYmd: '2026-07-31',
    selectCustomRange: jest.fn(),
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
            { key: 'w1', label: 'Wk 1', fullLabel: 'Jul 1–7', cents: 50000 },
            { key: 'w2', label: 'Wk 2', fullLabel: 'Jul 8–14', cents: 75000 },
          ],
        },
      }),
    );

    renderWithProviders(<PaymentsRevenueSection businessId="biz-1" />);

    expect(screen.getByText('$1,250')).toBeTruthy();
    expect(screen.getByText('Jul 1 – Jul 31')).toBeTruthy();
    expect(screen.getByText('Wk 1')).toBeTruthy();
    expect(screen.getAllByText('Jul 8–14').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Week 2')).toBeNull();
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

  it('shows the custom date range on the trigger', () => {
    mockUsePaymentsRevenue.mockReturnValue(
      emptySummary({
        range: 'custom',
        customFromYmd: '2026-03-03',
        customToYmd: '2026-03-18',
        fromYmd: '2026-03-03',
        toYmd: '2026-03-18',
        selectCustomRange: jest.fn(),
        summary: {
          collectedCents: 8000,
          jobsPaid: 2,
          changePct: 10,
          compareLabel: 'vs prior period',
          bucketKind: 'daily',
          bars: [
            { key: '2026-03-03', label: '3', fullLabel: 'Tue, Mar 3', cents: 3000 },
            { key: '2026-03-18', label: '18', fullLabel: 'Wed, Mar 18', cents: 5000 },
          ],
        },
      }),
    );

    renderWithProviders(<PaymentsRevenueSection businessId="biz-1" />);
    expect(screen.getByLabelText(/Time range: Mar 3–18/)).toBeTruthy();
    expect(screen.getByText('Mar 3 – Mar 18')).toBeTruthy();
    expect(screen.getByText(/10% vs prior period/)).toBeTruthy();
    expect(screen.getByText('Best day')).toBeTruthy();
  });
});
