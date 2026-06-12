import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { CreateFlowFooter } from '../components/CreateFlowFooter';

function renderFooter(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <CreateFlowFooter {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('CreateFlowFooter', () => {
  it('shows Done when appointment is confirmed', () => {
    const onDone = jest.fn();
    renderFooter({
      appointmentConfirmed: true,
      step: 0,
      lastStepIndex: 7,
      canContinue: true,
      hideWhileSubmitPanel: false,
      paddingBottom: 20,
      onBack: jest.fn(),
      onContinue: jest.fn(),
      onDone,
    });

    fireEvent.press(screen.getByText('Done'));
    expect(onDone).toHaveBeenCalled();
  });

  it('calls onContinue when Confirm is enabled on last step', () => {
    const onContinue = jest.fn();
    renderFooter({
      appointmentConfirmed: false,
      step: 7,
      lastStepIndex: 7,
      canContinue: true,
      hideWhileSubmitPanel: false,
      paddingBottom: 20,
      onBack: jest.fn(),
      onContinue,
      onDone: jest.fn(),
    });

    fireEvent.press(screen.getByText('Confirm'));
    expect(onContinue).toHaveBeenCalled();
  });

  it('hides footer while submit panel is visible', () => {
    renderFooter({
      appointmentConfirmed: false,
      step: 7,
      lastStepIndex: 7,
      canContinue: true,
      hideWhileSubmitPanel: true,
      paddingBottom: 20,
      onBack: jest.fn(),
      onContinue: jest.fn(),
      onDone: jest.fn(),
    });

    expect(screen.queryByText('Confirm')).toBeNull();
  });

  it('disables Confirm when canContinue is false', () => {
    renderFooter({
      appointmentConfirmed: false,
      step: 7,
      lastStepIndex: 7,
      canContinue: false,
      hideWhileSubmitPanel: false,
      paddingBottom: 20,
      onBack: jest.fn(),
      onContinue: jest.fn(),
      onDone: jest.fn(),
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.props.accessibilityState?.disabled).toBe(true);
  });
});
