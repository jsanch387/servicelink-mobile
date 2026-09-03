import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { QuoteNotesThread } from '../components/QuoteNotesThread';

function renderThread(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <QuoteNotesThread {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('QuoteNotesThread', () => {
  it('shows customer and shop turns by name', () => {
    renderThread({
      businessName: "Mike's Mobile",
      businessNote: 'Includes clay bar treatment.',
      customerName: 'Jesus Sanchez',
      customerNote: 'Please remove the coffee stain.',
    });

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByLabelText('Quote notes thread')).toBeTruthy();
    expect(screen.getByText('Jesus Sanchez')).toBeTruthy();
    expect(screen.getByText('Please remove the coffee stain.')).toBeTruthy();
    expect(screen.getByText("Mike's Mobile")).toBeTruthy();
    expect(screen.getByText('Includes clay bar treatment.')).toBeTruthy();
    expect(screen.queryByText('Customer notes')).toBeNull();
    expect(screen.queryByText('Business notes')).toBeNull();
  });

  it('renders a single note as plain text, not a thread', () => {
    renderThread({
      customerName: 'Jesus Sanchez',
      customerNote: 'Please remove the coffee stain.',
    });

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Please remove the coffee stain.')).toBeTruthy();
    expect(screen.queryByLabelText('Quote notes thread')).toBeNull();
    expect(screen.queryByText('Jesus Sanchez')).toBeNull();
  });

  it('renders a single shop note as plain text', () => {
    renderThread({
      businessName: "Mike's Mobile",
      businessNote: 'Includes clay bar treatment.',
    });

    expect(screen.getByText('Includes clay bar treatment.')).toBeTruthy();
    expect(screen.queryByLabelText('Quote notes thread')).toBeNull();
    expect(screen.queryByText("Mike's Mobile")).toBeNull();
  });

  it('renders nothing when both notes are empty', () => {
    renderThread({ customerName: 'Pat' });
    expect(screen.queryByText('Notes')).toBeNull();
  });
});
