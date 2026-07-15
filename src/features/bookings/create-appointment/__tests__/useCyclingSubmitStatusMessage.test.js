import { act, renderHook } from '@testing-library/react-native';
import { useCyclingSubmitStatusMessage } from '../hooks/useCyclingSubmitStatusMessage';

describe('useCyclingSubmitStatusMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the first message when inactive', () => {
    const { result } = renderHook(() => useCyclingSubmitStatusMessage(false, ['One', 'Two'], 1000));

    expect(result.current).toBe('One');
  });

  it('advances through messages and holds the final message while active', () => {
    const { result } = renderHook(() => useCyclingSubmitStatusMessage(true, ['One', 'Two'], 1000));

    expect(result.current).toBe('One');

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('Two');

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('Two');
  });
});
