import { fireEvent, render, screen } from '@testing-library/react-native';
import { CompleteVisitReceiptEmailNotice } from '../components/CompleteVisitReceiptEmailNotice';
import {
  COMPLETE_VISIT_RECEIPT_CONTACT_ADD_LINK,
  COMPLETE_VISIT_RECEIPT_CONTACT_CTA_DETAIL,
  COMPLETE_VISIT_RECEIPT_CONTACT_NEEDED,
} from '../constants/completeVisitReceiptEmailCopy';

jest.mock('../../../../theme', () => ({
  useTheme: () => ({
    colors: {
      text: '#111',
      textMuted: '#666',
      cardSurface: '#fff',
      shell: '#f5f5f5',
      border: '#ddd',
    },
    isDark: false,
  }),
  useTypography: () => ({ fontFamily: 'System' }),
}));

describe('CompleteVisitReceiptEmailNotice', () => {
  it('renders notice copy and add contact button', () => {
    render(<CompleteVisitReceiptEmailNotice onPressAddContact={jest.fn()} />);

    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_CONTACT_NEEDED)).toBeTruthy();
    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_CONTACT_CTA_DETAIL)).toBeTruthy();
    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_CONTACT_ADD_LINK)).toBeTruthy();
  });

  it('calls onPressAddContact when button is pressed', () => {
    const onPressAddContact = jest.fn();
    render(<CompleteVisitReceiptEmailNotice onPressAddContact={onPressAddContact} />);

    fireEvent.press(screen.getByText(COMPLETE_VISIT_RECEIPT_CONTACT_ADD_LINK));
    expect(onPressAddContact).toHaveBeenCalledTimes(1);
  });
});
