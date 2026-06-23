import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TapToPayHowItWorksSheet } from '../components/TapToPayHowItWorksSheet';
import {
  TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE,
  TAP_TO_PAY_VIEW_DEMO_LABEL,
} from '../constants/tapToPayHowItWorksCopy';

jest.mock('../native/presentTapToPayEducation', () => ({
  isTapToPayEducationAvailable: jest.fn(() => true),
  getTapToPayEducationUnavailableMessage: jest.fn(() => 'Unavailable'),
  presentTapToPayEducation: jest.fn(() => Promise.resolve()),
}));

const {
  isTapToPayEducationAvailable,
  presentTapToPayEducation,
} = require('../native/presentTapToPayEducation');

describe('TapToPayHowItWorksSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isTapToPayEducationAvailable.mockReturnValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    Alert.alert.mockRestore();
  });

  it('opens Apple merchant education from View demo without marking seen', async () => {
    renderWithProviders(<TapToPayHowItWorksSheet visible onRequestClose={() => {}} />);

    expect(screen.getByText(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: TAP_TO_PAY_VIEW_DEMO_LABEL }));

    await waitFor(() => expect(presentTapToPayEducation).toHaveBeenCalledWith({ markSeen: false }));
  });

  it('hides View demo when Apple education is unavailable', () => {
    isTapToPayEducationAvailable.mockReturnValue(false);

    renderWithProviders(<TapToPayHowItWorksSheet visible onRequestClose={() => {}} />);

    expect(screen.queryByRole('button', { name: TAP_TO_PAY_VIEW_DEMO_LABEL })).toBeNull();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
  });
});
