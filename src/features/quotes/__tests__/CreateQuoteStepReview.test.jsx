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

  it('shows entered notes as read-only, not as an input', () => {
    render(
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <CreateQuoteStepReview
            addonLines={[]}
            businessNote="Includes clay bar."
            customerEmail="pat@example.com"
            customerName="Pat"
            customerPhoneDisplay=""
            customerRequestNotes="Please remove the coffee stain."
            durationHhMm="01:00"
            priceUsdText="100"
            scheduleMode="customer"
            scheduledDateYyyyMmDd=""
            scheduledStartTime12h=""
            serviceName="Detail"
            vehicleMake=""
            vehicleModel=""
            vehicleYear=""
          />
        </TypographyProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Request')).toBeTruthy();
    expect(screen.getByText('Please remove the coffee stain.')).toBeTruthy();
    expect(screen.queryByText('Your note')).toBeNull();
    expect(screen.getByText('Includes clay bar.')).toBeTruthy();
    expect(screen.queryByPlaceholderText(/appears on the quote/i)).toBeNull();
  });

  it('lists both vehicles when a second one is set', () => {
    render(
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
            scheduleMode="customer"
            scheduledDateYyyyMmDd=""
            scheduledStartTime12h=""
            serviceName="Detail"
            vehicle2Make="GMC"
            vehicle2Model="Yukon AT4"
            vehicle2Year="2022"
            vehicleMake="GMC"
            vehicleModel="Sierra AT4"
            vehicleYear="2021"
          />
        </TypographyProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Vehicles')).toBeTruthy();
    expect(screen.getByText('2021 GMC Sierra AT4')).toBeTruthy();
    expect(screen.getByText('2022 GMC Yukon AT4')).toBeTruthy();
  });
});
