import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { QuoteRequestDetailBody } from '../components/QuoteRequestDetailBody';
import * as sms from '../../../utils/openNativeSms';

jest.spyOn(sms, 'openNativeSms').mockImplementation(() => Promise.resolve());
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

function renderRequest(model) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <QuoteRequestDetailBody model={model} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('QuoteRequestDetailBody', () => {
  beforeEach(() => {
    sms.openNativeSms.mockClear();
    Linking.canOpenURL.mockClear();
    Linking.openURL.mockClear();
  });

  it('puts customer first with text and copy, then the request', async () => {
    renderRequest({
      customerName: 'Jesus Sanchez',
      email: 'jesus@example.com',
      message: 'Preferred timing: This week\nneed my seats cleaned shampooed and extracted',
      phone: '4325234542',
      receivedAt: 'Aug 31, 2026, 11:09 PM',
      serviceName: 'need my seats cleaned shampooed and extracted',
      vehicle: '2018 Toyota Tacoma',
    });

    expect(screen.queryByText('Customer')).toBeNull();
    expect(screen.getByText('Jesus Sanchez')).toBeTruthy();
    expect(screen.getByText('JS')).toBeTruthy();
    expect(screen.getByText('+1 (432) 523-4542')).toBeTruthy();
    expect(screen.getByLabelText('Text +1 (432) 523-4542')).toBeTruthy();
    expect(screen.getByText('jesus@example.com')).toBeTruthy();
    expect(screen.getByText('Request')).toBeTruthy();
    expect(screen.getAllByText('need my seats cleaned shampooed and extracted')).toHaveLength(1);
    expect(screen.getByText('Schedule')).toBeTruthy();
    expect(screen.getByText('Preferred timing')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('Activity')).toBeTruthy();
    expect(screen.getByText('Received')).toBeTruthy();
    expect(screen.getByText('Vehicle')).toBeTruthy();
    expect(screen.getByText('2018 Toyota Tacoma')).toBeTruthy();
    expect(screen.queryByText('Details')).toBeNull();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('Jesus Sanchez')).toBeLessThan(tree.indexOf('Request'));
    expect(tree.indexOf('Request')).toBeLessThan(tree.indexOf('Schedule'));
    expect(tree.indexOf('Schedule')).toBeLessThan(tree.indexOf('Activity'));
    expect(tree.indexOf('Vehicle')).toBeLessThan(tree.indexOf('Activity'));

    fireEvent.press(screen.getByLabelText('Call +1 (432) 523-4542'));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('tel:+14325234542');
    });

    fireEvent.press(screen.getByLabelText('Text +1 (432) 523-4542'));
    expect(sms.openNativeSms).toHaveBeenCalledWith(
      expect.objectContaining({ address: '+14325234542' }),
    );
  });

  it('splits catalog service, note, and a booked-style date and time', () => {
    renderRequest({
      message: 'Please remove a coffee stain.',
      requestedDateLabel: 'June 10, 2026',
      requestedTimeLabel: '2:30 PM',
      serviceAddressLine: '500 Congress Ave, Austin, TX',
      serviceName: 'Full detail',
      vehicle: '2022 Honda Civic',
    });

    expect(screen.getByText('Service')).toBeTruthy();
    expect(screen.getByText('Full detail')).toBeTruthy();
    expect(screen.getByText('Request')).toBeTruthy();
    expect(screen.getByText('Please remove a coffee stain.')).toBeTruthy();
    expect(screen.getByText('Date')).toBeTruthy();
    expect(screen.getByText('June 10, 2026')).toBeTruthy();
    expect(screen.getByText('Time')).toBeTruthy();
    expect(screen.getByText('2:30 PM')).toBeTruthy();
    expect(screen.getByText('Location')).toBeTruthy();
    expect(screen.getByText('500 Congress Ave, Austin, TX')).toBeTruthy();
    expect(screen.queryByText('Activity')).toBeNull();
    expect(screen.queryByText('Received')).toBeNull();
  });

  it('lists both vehicles when the request covers two', () => {
    renderRequest({
      message: 'Estimate for my truck and my Yukon.',
      serviceName: 'Full detail',
      vehicle: '2021 GMC Sierra AT4',
      vehicles: ['2021 GMC Sierra AT4', '2022 GMC Yukon AT4'],
    });

    expect(screen.getByText('Vehicles')).toBeTruthy();
    expect(screen.getByText('2021 GMC Sierra AT4')).toBeTruthy();
    expect(screen.getByText('2022 GMC Yukon AT4')).toBeTruthy();
  });
});
