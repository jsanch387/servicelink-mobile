import { act, renderHook } from '@testing-library/react-native';
import { useBookingActionsMovedTip } from '../hooks/useBookingActionsMovedTip';

describe('useBookingActionsMovedTip', () => {
  it('always shows when actions are available', () => {
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    expect(result.current.visible).toBe(true);
  });

  it('stays hidden when the actions menu is not available', () => {
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: false }));

    expect(result.current.visible).toBe(false);
  });

  it('hides for this visit after dismiss', () => {
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.visible).toBe(false);
  });
});
