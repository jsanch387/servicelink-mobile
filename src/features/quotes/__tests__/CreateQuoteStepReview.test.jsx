import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { CreateQuoteStepReview } from '../components/create-quote/CreateQuoteStepReview';

function renderReview() {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <CreateQuoteStepReview
          addonLines={[]}
          businessNote=""
          customerEmail="pat@example.com"
          customerName="Pat"
          customerPhoneDisplay=""
          customerRequestNotes=""
          durationHhMm="01:00"
          priceUsdText="100"
          scheduleMode="pick"
          scheduledDateYyyyMmDd="2026-09-01"
          scheduledStartTime12h="2:00 PM"
          serviceName="Detail"
          vehicleMake=""
          vehicleModel=""
          vehicleYear=""
          onBusinessNoteChange={jest.fn()}
        />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CreateQuoteStepReview', () => {
  it('shows duration as a field in the Schedule card', () => {
    renderReview();

    expect(screen.getByText('Schedule')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('1 hr')).toBeTruthy();
    expect(screen.queryByText(/Duration ·/)).toBeNull();
  });
});
