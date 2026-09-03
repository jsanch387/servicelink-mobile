import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { QuoteInboxCard } from '../components/QuoteInboxCard';

function renderCard(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <QuoteInboxCard
          customerName="Sarah Jenkins"
          statusLabel="Quote sent"
          statusRaw="sent"
          variant="sent"
          vehicleLabel="2022 Tesla Model Y"
          onPress={jest.fn()}
          {...props}
        />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('QuoteInboxCard', () => {
  it('pairs the name with the status pill and keeps a bare date in the footer', () => {
    renderCard({ timingLabel: 'Tomorrow - 2:30 PM' });
    const tree = JSON.stringify(screen.toJSON());

    expect(screen.getByText('Sarah Jenkins')).toBeTruthy();
    expect(screen.getByText(/2022 Tesla Model Y/)).toBeTruthy();
    expect(screen.getByText('Quote sent')).toBeTruthy();
    expect(screen.getByText('Tomorrow - 2:30 PM')).toBeTruthy();
    expect(screen.queryByText(/When/)).toBeNull();
    expect(tree.indexOf('Quote sent')).toBeLessThan(tree.indexOf('Tomorrow'));
  });

  it('never shows an amount, even on a priced quote', () => {
    renderCard({ priceLabel: '$280', statusLabel: 'Approved', statusRaw: 'approved' });

    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.queryByText('$280')).toBeNull();
  });

  it('caps the vehicle line with a count when a quote covers several', () => {
    renderCard({ vehicleExtraLabel: '+1 more' });

    expect(screen.getByText(/2022 Tesla Model Y/)).toBeTruthy();
    expect(screen.getByText('+1 more')).toBeTruthy();
  });

  it('shows the service instead of the vehicle once the work is known', () => {
    renderCard({ serviceLabel: 'Full detail', vehicleExtraLabel: '+1 more' });

    expect(screen.getByText('Full detail')).toBeTruthy();
    expect(screen.queryByText(/2022 Tesla Model Y/)).toBeNull();
    expect(screen.queryByText('+1 more')).toBeNull();
  });

  it('renders a request card', () => {
    renderCard({
      customerName: 'Jesus Sanchez',
      statusLabel: 'New request',
      statusRaw: 'requested',
      timingLabel: 'This week',
      variant: 'request',
      vehicleLabel: '2018 Toyota Tacoma',
    });

    expect(screen.getByText('New request')).toBeTruthy();
    expect(screen.getByText(/2018 Toyota Tacoma/)).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.queryByText(/When/)).toBeNull();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    renderCard({ onPress });

    fireEvent.press(screen.getByLabelText('Quote for Sarah Jenkins'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
