import { act, renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { CREATE_APPOINTMENT_STEP } from '../constants';
import { useCreateAppointmentSubmitPanel } from '../hooks/useCreateAppointmentSubmitPanel';

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Error: 'error' },
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

describe('useCreateAppointmentSubmitPanel', () => {
  it('shows the submit panel and recognizes email notification while pending on review', () => {
    const { result } = renderHook(() =>
      useCreateAppointmentSubmitPanel({
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        appointmentConfirmed: false,
        isMutationPending: true,
        customerPhone: null,
        customerEmail: 'customer@example.com',
      }),
    );

    expect(result.current.showSubmitPanel).toBe(true);
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.shouldNotifyCustomer).toBe(true);
  });

  it('shows the submit panel immediately when confirm is requested before mutation pending', () => {
    const { result } = renderHook(() =>
      useCreateAppointmentSubmitPanel({
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        appointmentConfirmed: false,
        isMutationPending: false,
        confirmRequested: true,
        customerPhone: null,
      }),
    );

    expect(result.current.showSubmitPanel).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('stores a safe error message and fires error haptic once', () => {
    const { result } = renderHook(() =>
      useCreateAppointmentSubmitPanel({
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        appointmentConfirmed: false,
        isMutationPending: false,
        customerPhone: '',
      }),
    );

    act(() => {
      result.current.handleMutationError(new Error('network down'));
    });

    expect(result.current.submitError).toBeTruthy();
    expect(result.current.showSubmitPanel).toBe(true);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');

    act(() => {
      result.current.clearSubmitError();
    });

    expect(result.current.submitError).toBeNull();
    expect(result.current.showSubmitPanel).toBe(false);
  });
});
