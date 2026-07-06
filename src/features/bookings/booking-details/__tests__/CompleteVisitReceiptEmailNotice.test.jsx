import { fireEvent, render, screen } from '@testing-library/react-native';
import { CompleteVisitReceiptEmailNotice } from '../components/CompleteVisitReceiptEmailNotice';
import {
  COMPLETE_VISIT_RECEIPT_EMAIL_ADD_LINK,
  COMPLETE_VISIT_RECEIPT_EMAIL_CTA_DETAIL,
  COMPLETE_VISIT_RECEIPT_EMAIL_NEEDED,
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
  it('renders notice copy and add email button', () => {
    render(<CompleteVisitReceiptEmailNotice onPressAddEmail={jest.fn()} />);

    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_EMAIL_NEEDED)).toBeTruthy();
    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_EMAIL_CTA_DETAIL)).toBeTruthy();
    expect(screen.getByText(COMPLETE_VISIT_RECEIPT_EMAIL_ADD_LINK)).toBeTruthy();
  });

  it('calls onPressAddEmail when button is pressed', () => {
    const onPressAddEmail = jest.fn();
    render(<CompleteVisitReceiptEmailNotice onPressAddEmail={onPressAddEmail} />);

    fireEvent.press(screen.getByText(COMPLETE_VISIT_RECEIPT_EMAIL_ADD_LINK));
    expect(onPressAddEmail).toHaveBeenCalledTimes(1);
  });
});
