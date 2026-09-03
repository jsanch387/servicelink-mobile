import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { SentQuoteDetailBody } from '../components/SentQuoteDetailBody';
import * as maps from '../../../utils/openMapsToAddress';

jest.spyOn(maps, 'openMapsToAddress').mockImplementation(() => Promise.resolve());

function renderBody(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <SentQuoteDetailBody businessName="Mike's Mobile" {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

const BASE_MODEL = {
  customerName: 'Jesus Sanchez',
  createdAtIso: '2026-09-01T00:09:00',
  priceFormatted: '$150',
  serviceTitle: 'Full detail',
  statusLabel: 'Pending',
  statusRaw: 'sent',
};

describe('SentQuoteDetailBody', () => {
  beforeEach(() => {
    maps.openMapsToAddress.mockClear();
  });

  it('shows customer and business notes when both are available', () => {
    renderBody({
      model: {
        ...BASE_MODEL,
        businessNote: 'Includes clay bar treatment.',
        customerNote: 'Please remove the coffee stain.',
      },
    });

    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Jesus Sanchez')).toBeTruthy();
    expect(screen.getByText('Please remove the coffee stain.')).toBeTruthy();
    expect(screen.getByText("Mike's Mobile")).toBeTruthy();
    expect(screen.getByText('Includes clay bar treatment.')).toBeTruthy();
    expect(screen.queryByText('Customer notes')).toBeNull();
    expect(screen.queryByText('Business notes')).toBeNull();
    expect(screen.getByText('Activity')).toBeTruthy();
    expect(screen.getByText('Created')).toBeTruthy();
    expect(screen.getByText('Sep 1, 12:09 AM')).toBeTruthy();
    expect(screen.queryByText('Waiting on customer response.')).toBeNull();
  });

  it('lists every vehicle the quote covers', () => {
    renderBody({
      model: { ...BASE_MODEL, vehicles: ['2021 GMC Sierra AT4', '2022 GMC Yukon AT4'] },
    });

    expect(screen.getByText('Vehicles')).toBeTruthy();
    expect(screen.getByText('2021 GMC Sierra AT4')).toBeTruthy();
    expect(screen.getByText('2022 GMC Yukon AT4')).toBeTruthy();
  });

  it('titles the section for a single vehicle', () => {
    renderBody({ model: { ...BASE_MODEL, vehicles: ['2021 GMC Sierra AT4'] } });

    expect(screen.getByText('Vehicle')).toBeTruthy();
    expect(screen.queryByText('Vehicles')).toBeNull();
  });

  it('opens the address in maps when the location is tapped', () => {
    renderBody({
      model: {
        ...BASE_MODEL,
        statusLabel: 'Approved',
        statusRaw: 'approved',
        serviceAddressLine: '1200 Main St, Austin, TX 78701',
      },
    });

    fireEvent.press(screen.getByText('1200 Main St, Austin, TX 78701'));

    expect(maps.openMapsToAddress).toHaveBeenCalledWith('1200 Main St, Austin, TX 78701');
  });

  it('puts customer notifications on the activity rail', () => {
    renderBody({
      model: {
        ...BASE_MODEL,
        communications: [
          {
            channel: 'email',
            type: 'quote_reminder',
            status: 'sent',
            sentAt: '2026-09-01T00:09:00',
          },
          {
            channel: 'sms',
            type: 'quote_reminder',
            status: 'failed',
            sentAt: '2026-09-01T00:09:00',
          },
        ],
      },
    });

    expect(screen.getByText('Email sent')).toBeTruthy();
    expect(screen.getByText('Text failed')).toBeTruthy();
  });
});
