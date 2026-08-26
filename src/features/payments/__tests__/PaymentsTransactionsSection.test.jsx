import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { PaymentsTransactionsSection } from '../components/PaymentsTransactionsSection';

const DEFAULT_ITEMS = [
  {
    id: 'txn_1',
    tone: 'in',
    title: 'Lights',
    subtitle: 'Jordan Lee · Tap to pay',
    amountLabel: '+$38.54',
    statusLabel: 'Paid',
    dateLabel: 'Aug 24',
    feeLabel: 'Fee $1.46',
    source: 'tap_to_pay',
  },
  {
    id: 'local_bp_1',
    tone: 'in',
    title: 'Wax',
    subtitle: 'Pat · Payment app',
    amountLabel: '+$20.00',
    statusLabel: 'Paid',
    dateLabel: 'Aug 24',
    feeLabel: null,
    source: 'payment_app',
  },
];

const mockFeed = {
  balance: {
    availableCaption: 'Available',
    pendingCaption: 'On the way',
    availableLabel: '$1,247.50',
    pendingLabel: '$320.00',
  },
  items: DEFAULT_ITEMS,
  hasMore: true,
  isLoading: false,
  isFetchingMore: false,
  errorMessage: null,
  refetch: jest.fn(),
  fetchMore: jest.fn(),
};

jest.mock('../hooks/usePaymentsTransactions', () => ({
  usePaymentsTransactions: () => mockFeed,
}));

describe('PaymentsTransactionsSection', () => {
  beforeEach(() => {
    mockFeed.isLoading = false;
    mockFeed.errorMessage = null;
    mockFeed.hasMore = true;
    mockFeed.items = DEFAULT_ITEMS;
    mockFeed.fetchMore.mockClear();
    mockFeed.refetch.mockClear();
  });

  it('paints balance and server row copy', () => {
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('$1,247.50')).toBeTruthy();
    expect(screen.getByText('On the way')).toBeTruthy();
    expect(screen.getByText('$320.00')).toBeTruthy();
    expect(screen.getByText('Lights')).toBeTruthy();
    expect(screen.getByText('Jordan Lee · Tap to pay')).toBeTruthy();
    expect(screen.getByText('+$38.54')).toBeTruthy();
    expect(screen.getByText('Fee $1.46')).toBeTruthy();
    expect(screen.getByText('Wax')).toBeTruthy();
    expect(screen.getByText('Aug 24')).toBeTruthy();
    expect(screen.queryByText('Paid')).toBeNull();
  });

  it('paints title plus smaller +N more from extraCount', () => {
    mockFeed.items = [
      {
        id: 'txn_multi',
        tone: 'in',
        title: 'Signature Shine',
        extraCount: 1,
        subtitle: 'Jordan Lee · Card',
        amountLabel: '+$189.00',
        statusLabel: 'Paid',
        dateLabel: 'Aug 24',
        feeLabel: null,
        source: 'booking',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText(/Signature Shine/)).toBeTruthy();
    expect(screen.getByText('+1 more')).toBeTruthy();
    expect(screen.getByText('Jordan Lee · Card')).toBeTruthy();
  });

  it('does not paint a leading · when the customer is missing', () => {
    mockFeed.items = [
      {
        id: 'txn_walkup',
        tone: 'in',
        title: 'Lights',
        extraCount: 0,
        subtitle: ' · Tap to pay',
        amountLabel: '+$38.54',
        statusLabel: 'Paid',
        dateLabel: 'Aug 24',
        source: 'tap_to_pay',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('Lights')).toBeTruthy();
    expect(screen.getByText('Tap to pay')).toBeTruthy();
    expect(screen.queryByText(/Jordan Lee/)).toBeNull();
    expect(screen.queryByText(/^·/)).toBeNull();
    expect(screen.queryByText('Customer')).toBeNull();
  });

  it('never paints Mixed jobs and puts +1 more next to the service', () => {
    mockFeed.items = [
      {
        id: 'txn_mixed',
        tone: 'in',
        title: 'Mixed job jobs',
        extraCount: 1,
        serviceName: 'Signature Shine',
        subtitle: 'Jordan Lee · Card',
        amountLabel: '+$189.00',
        statusLabel: 'Paid',
        dateLabel: 'Aug 24',
        source: 'booking',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText(/Signature Shine/)).toBeTruthy();
    expect(screen.getByText('+1 more')).toBeTruthy();
    expect(screen.queryByText(/mixed/i)).toBeNull();
    expect(screen.queryByText(/^jobs$/i)).toBeNull();
  });

  it('keeps +N more when the service name is long', () => {
    mockFeed.items = [
      {
        id: 'txn_long',
        tone: 'in',
        title: 'Signature Shine Ceramic Interior and Exterior Detail Package',
        extraCount: 2,
        subtitle: 'Jordan Lee · Card',
        amountLabel: '+$189.00',
        statusLabel: 'Paid',
        dateLabel: 'Aug 24',
        source: 'booking',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(
      screen.getByText('Signature Shine Ceramic Interior and Exterior Detail Package'),
    ).toBeTruthy();
    expect(screen.getByText('+2 more')).toBeTruthy();
  });

  it('shows a centered retry when the first load fails', () => {
    mockFeed.items = [];
    mockFeed.errorMessage = 'Network error. Check your connection and try again.';
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText("Couldn't load transactions")).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Try again'));
    expect(mockFeed.refetch).toHaveBeenCalled();
  });

  it('keeps loaded rows if Show more fails', () => {
    mockFeed.errorMessage = 'Network error. Check your connection and try again.';
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('Lights')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByText("Couldn't load transactions")).toBeNull();
  });

  it('shows an empty state without Show more', () => {
    mockFeed.items = [];
    mockFeed.hasMore = true;
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('No transactions yet')).toBeTruthy();
    expect(screen.queryByLabelText('Show more')).toBeNull();
  });

  it('shows a loading skeleton instead of a spinner', () => {
    mockFeed.isLoading = true;
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByLabelText('Loading transactions')).toBeTruthy();
    expect(screen.queryByText('Available')).toBeNull();
  });

  it('keeps notable status copy such as Arrived', () => {
    mockFeed.items = [
      {
        id: 'po_1',
        kind: 'payout',
        tone: 'payout',
        title: 'Payout',
        subtitle: '',
        amountLabel: '$1,200.00',
        statusLabel: 'Arrived',
        dateLabel: 'Aug 23',
        feeLabel: null,
        source: 'payout',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('Payout')).toBeTruthy();
    expect(screen.getByText('Arrived')).toBeTruthy();
    expect(screen.getByText('Aug 23')).toBeTruthy();
    expect(screen.getByText('$1,200.00')).toBeTruthy();
  });

  it('normalizes payout-to-bank titles to the same two-line row', () => {
    mockFeed.items = [
      {
        id: 'po_2',
        kind: 'payout',
        tone: 'payout',
        title: 'Payout to your bank',
        subtitle: 'Chase •••• 1234',
        amountLabel: '$800.00',
        statusLabel: 'Arrived',
        dateLabel: 'Aug 22',
        source: 'payout',
      },
    ];
    renderWithProviders(<PaymentsTransactionsSection />);
    expect(screen.getByText('Payout')).toBeTruthy();
    expect(screen.getByText('Arrived')).toBeTruthy();
    expect(screen.queryByText('Payout to your bank')).toBeNull();
    expect(screen.queryByText(/Chase/)).toBeNull();
  });

  it('loads the next page without formatting amounts', () => {
    renderWithProviders(<PaymentsTransactionsSection />);
    fireEvent.press(screen.getByLabelText('Show more'));
    expect(mockFeed.fetchMore).toHaveBeenCalled();
  });
});
