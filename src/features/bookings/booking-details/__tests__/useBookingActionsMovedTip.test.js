import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBookingActionsMovedTip } from '../hooks/useBookingActionsMovedTip';
import { markBookingActionsMovedTipSeen } from '../storage/bookingActionsMovedTipStorage';

describe('useBookingActionsMovedTip', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows when actions are available and the tip has not been seen', async () => {
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    expect(result.current.visible).toBe(false);
    await waitFor(() => {
      expect(result.current.visible).toBe(true);
    });
  });

  it('stays hidden when the actions menu is not available', () => {
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: false }));

    expect(result.current.visible).toBe(false);
  });

  it('does not show again after it was already seen', async () => {
    await markBookingActionsMovedTipSeen();
    const { result } = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.visible).toBe(false);
  });

  it('does not show again after it was displayed once', async () => {
    const first = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    await waitFor(() => {
      expect(first.result.current.visible).toBe(true);
    });
    first.unmount();

    const second = renderHook(() => useBookingActionsMovedTip({ enabled: true }));
    await waitFor(() => {
      expect(second.result.current.ready).toBe(true);
    });
    expect(second.result.current.visible).toBe(false);
  });

  it('hides after dismiss and stays hidden on the next visit', async () => {
    const first = renderHook(() => useBookingActionsMovedTip({ enabled: true }));

    await waitFor(() => {
      expect(first.result.current.visible).toBe(true);
    });

    act(() => {
      first.result.current.dismiss();
    });
    expect(first.result.current.visible).toBe(false);
    first.unmount();

    const second = renderHook(() => useBookingActionsMovedTip({ enabled: true }));
    await waitFor(() => {
      expect(second.result.current.ready).toBe(true);
    });
    expect(second.result.current.visible).toBe(false);
  });
});
