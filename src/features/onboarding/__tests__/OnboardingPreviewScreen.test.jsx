import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { resolveBookingSlugAvailability } from '../api/checkBookingSlug';
import {
  finishOnboardingSetup,
  practiceBookingUrl,
  saveOnboardingIndustry,
} from '../api/onboardingV3Api';
import { OnboardingPreviewScreen } from '../screens/OnboardingPreviewScreen';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('../api/checkBookingSlug', () => ({
  resolveBookingSlugAvailability: jest.fn(async (slug) => ({ status: 'free', slug })),
}));

jest.mock('../api/onboardingV3Api', () => {
  const actual = jest.requireActual('../api/onboardingV3Api');
  return {
    ...actual,
    saveOnboardingIndustry: jest.fn(async () => ({ ok: true, businessProfileId: 'biz' })),
    finishOnboardingSetup: jest.fn(async () => ({
      ok: true,
      slug: 'mikesdetailing',
      businessProfileId: 'biz',
    })),
  };
});

describe('OnboardingPreviewScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    saveOnboardingIndustry.mockClear();
    finishOnboardingSetup.mockClear();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    saveOnboardingIndustry.mockImplementation(async () => ({ ok: true, businessProfileId: 'biz' }));
    finishOnboardingSetup.mockImplementation(async () => ({
      ok: true,
      slug: 'mikesdetailing',
      businessProfileId: 'biz',
    }));
    resolveBookingSlugAvailability.mockImplementation(async (slug) => ({ status: 'free', slug }));
  });

  it('walks industry, business, and you are live without leaving the screen until the end', async () => {
    renderWithProviders(<OnboardingPreviewScreen />);

    expect(screen.getByText("Let's set up your booking page")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
    expect(screen.getByText('What kind of work do you do?')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('What kind of work do you do?')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Vehicle services' }));
    fireEvent.press(screen.getByRole('button', { name: 'Auto detailing' }));
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Business details')).toBeTruthy();
    });
    expect(saveOnboardingIndustry).toHaveBeenCalledWith({
      industry: 'Vehicle Services',
      trades: ['detailing'],
    });
    fireEvent.changeText(screen.getByLabelText('Business name'), "Mike's Detailing");
    expect(screen.getByText('mikesdetailing')).toBeTruthy();
    await waitFor(
      () => {
        expect(screen.getByLabelText('Available')).toBeTruthy();
      },
      { timeout: 3000 },
    );
    fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

    await waitFor(() => {
      expect(screen.getByText("You're all set")).toBeTruthy();
    });
    expect(finishOnboardingSetup).toHaveBeenCalledWith({
      businessName: "Mike's Detailing",
      slug: 'mikesdetailing',
      phone: '',
      industry: 'Vehicle Services',
      trades: ['detailing'],
    });
    expect(screen.getByText('Your booking page is live and ready for customers.')).toBeTruthy();
    expect(screen.getByText("Mike's Detailing")).toBeTruthy();
    expect(screen.getByText('myservicelink.app/mikesdetailing')).toBeTruthy();
    expect(screen.getByText('See exactly what your customers see')).toBeTruthy();
    expect(screen.getByText('Choose a service')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Book a test appointment' }));
    expect(Linking.openURL).toHaveBeenCalledWith(practiceBookingUrl('mikesdetailing'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('opens you are live when the link check has not confirmed yet', async () => {
    resolveBookingSlugAvailability.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<OnboardingPreviewScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
    fireEvent.press(screen.getByRole('button', { name: 'Vehicle services' }));
    fireEvent.press(screen.getByRole('button', { name: 'Auto detailing' }));
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(screen.getByText('Business details')).toBeTruthy();
    });
    fireEvent.changeText(screen.getByLabelText('Business name'), "Mike's Detailing");
    fireEvent.press(screen.getByRole('button', { name: 'Finish setup' }));

    await waitFor(() => {
      expect(screen.getByText("You're all set")).toBeTruthy();
    });
  });
});
