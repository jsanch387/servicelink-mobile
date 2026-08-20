import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { PaymentsRevenueRangePicker } from '../components/PaymentsRevenueRangePicker';
import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';

describe('PaymentsRevenueRangePicker', () => {
  it('shows a close control and no Back on the compact time-range sheet', () => {
    renderWithProviders(
      <PaymentsRevenueRangePicker
        customFromYmd="2026-03-03"
        customToYmd="2026-03-18"
        value={REVENUE_RANGE.CUSTOM}
        onChange={jest.fn()}
        onSelectCustom={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText(/Time range: Mar 3–18/));

    expect(screen.getByLabelText('Close')).toBeTruthy();
    expect(screen.queryByText('Back')).toBeNull();
    expect(screen.getByText('Pick dates')).toBeTruthy();
  });

  it('keeps View disabled until a start and end date exist', () => {
    renderWithProviders(
      <PaymentsRevenueRangePicker
        customFromYmd={null}
        customToYmd={null}
        value={REVENUE_RANGE.CUSTOM}
        onChange={jest.fn()}
        onSelectCustom={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText(/Time range: Custom/));
    fireEvent.press(screen.getByText('Pick dates'));

    expect(screen.getByText('Tap a start date and an end date')).toBeTruthy();
    expect(screen.queryByText('Back')).toBeNull();
    expect(screen.getByLabelText('Close')).toBeTruthy();
    expect(screen.getByText('View')).toBeDisabled();
  });

  it('enables View when an existing custom range is complete', () => {
    renderWithProviders(
      <PaymentsRevenueRangePicker
        customFromYmd="2026-03-03"
        customToYmd="2026-03-18"
        value={REVENUE_RANGE.CUSTOM}
        onChange={jest.fn()}
        onSelectCustom={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText(/Time range: Mar 3–18/));
    fireEvent.press(screen.getByText('Pick dates'));

    expect(screen.getByText('View')).toBeEnabled();
    expect(screen.queryByText('Back')).toBeNull();
  });
});
