import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CompleteVisitReceiptEmailDialog } from '../components/CompleteVisitReceiptEmailDialog';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { ToastProvider } from '../../../../components/ui';

function renderDialog(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <ToastProvider>
          <CompleteVisitReceiptEmailDialog visible onClose={jest.fn()} {...props} />
        </ToastProvider>
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CompleteVisitReceiptEmailDialog', () => {
  it('enables Save and submits when only a valid phone is entered', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    renderDialog({ onSave });

    fireEvent.changeText(screen.getByLabelText('Phone'), '5552345678');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).not.toBeDisabled();
    fireEvent.press(save);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        email: '',
        phone: '5552345678',
      });
    });
  });
});
