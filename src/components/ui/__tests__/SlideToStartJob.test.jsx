import { act, screen } from '@testing-library/react-native';
import { SlideToStartJob } from '../SlideToStartJob';
import { renderWithProviders } from '../../../features/home/__tests__/testUtils';

describe('SlideToStartJob', () => {
  it('fires onComplete via accessibility activate', () => {
    const onComplete = jest.fn();
    renderWithProviders(
      <SlideToStartJob
        accessibilityLabel="Start job"
        surfaceTone="light"
        onComplete={onComplete}
      />,
    );
    const track = screen.getByTestId('slide-to-start-job-track');
    act(() => {
      track.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders slide label', () => {
    renderWithProviders(<SlideToStartJob surfaceTone="light" onComplete={() => {}} />);
    expect(screen.getByText('Slide to start job')).toBeTruthy();
  });
});
