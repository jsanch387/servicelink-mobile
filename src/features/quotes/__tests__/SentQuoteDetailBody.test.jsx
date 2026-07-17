import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { SentQuoteDetailBody } from '../components/SentQuoteDetailBody';

function renderDetail(model) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <SentQuoteDetailBody model={model} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('SentQuoteDetailBody', () => {
  it('shows customer and business notes when both are available', () => {
    renderDetail({
      businessNote: 'Includes clay bar treatment.',
      customerNote: 'Please remove the coffee stain.',
      priceFormatted: '$150',
      serviceTitle: 'Full detail',
      statusLabel: 'Pending',
      statusRaw: 'sent',
    });

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Customer notes')).toBeTruthy();
    expect(screen.getByText('Please remove the coffee stain.')).toBeTruthy();
    expect(screen.getByText('Business notes')).toBeTruthy();
    expect(screen.getByText('Includes clay bar treatment.')).toBeTruthy();
  });
});
