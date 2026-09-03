import {
  formatQuoteVehicleLine,
  parseQuoteVehicleLine,
  readPrefillSecondVehicle,
} from '../utils/quoteVehicles';

describe('quoteVehicles', () => {
  it('formats and parses a year make model line', () => {
    expect(formatQuoteVehicleLine({ year: '2022', make: 'GMC', model: 'Yukon AT4' })).toBe(
      '2022 GMC Yukon AT4',
    );
    expect(parseQuoteVehicleLine('2022 GMC Yukon AT4')).toEqual({
      year: '2022',
      make: 'GMC',
      model: 'Yukon AT4',
    });
  });

  it('reads the second vehicle from the public request line', () => {
    expect(
      readPrefillSecondVehicle({
        primaryLine: '2021 GMC Sierra AT4',
        requestMessage:
          'Preferred timing: Flexible\nSecond vehicle: 2022 GMC Yukon AT4\n\nBoth please.',
      }),
    ).toEqual({
      year: '2022',
      make: 'GMC',
      model: 'Yukon AT4',
    });
  });

  it('prefers assets over the request line', () => {
    expect(
      readPrefillSecondVehicle({
        assets: [
          { type: 'vehicle', label: '2019 Audi Q5' },
          { type: 'vehicle', label: '2020 Kia Telluride' },
        ],
        requestMessage: 'Second vehicle: 2012 BMW 335i',
      }),
    ).toEqual({
      year: '2020',
      make: 'Kia',
      model: 'Telluride',
    });
  });

  it('prefers a vehicles array over the request line', () => {
    expect(
      readPrefillSecondVehicle({
        vehicles: ['2019 Audi Q5', '2020 Kia Telluride'],
        requestMessage: 'Second vehicle: 2012 BMW 335i',
      }),
    ).toEqual({
      year: '2020',
      make: 'Kia',
      model: 'Telluride',
    });
  });
});
