jest.mock('servicelink-job-live-activity', () => ({
  isJobLiveActivityAvailable: jest.fn(() => true),
  isJobLiveActivityNativeModuleLinked: jest.fn(() => true),
  startJobLiveActivityNative: jest.fn(() => Promise.resolve()),
  endJobLiveActivityNative: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  endJobLiveActivityNative,
  isJobLiveActivityAvailable,
  isJobLiveActivityNativeModuleLinked,
  startJobLiveActivityNative,
} from 'servicelink-job-live-activity';
import {
  endJobLiveActivity,
  jobLiveActivityFieldsFromBooking,
  startJobLiveActivity,
} from '../jobLiveActivity';

describe('jobLiveActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isJobLiveActivityAvailable.mockReturnValue(true);
    isJobLiveActivityNativeModuleLinked.mockReturnValue(true);
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  it('maps booking names with fallbacks', () => {
    expect(
      jobLiveActivityFieldsFromBooking({ customer_name: 'Ana', service_name: 'Detail' }),
    ).toEqual({
      customerName: 'Ana',
      serviceName: 'Detail',
    });
    expect(jobLiveActivityFieldsFromBooking(null)).toEqual({
      customerName: 'Customer',
      serviceName: 'Job',
    });
  });

  it('starts a timer from now and persists the start time', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    await startJobLiveActivity({
      id: 'book-1',
      customer_name: 'Ana',
      service_name: 'Interior',
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@servicelink/jobLiveActivity.startedAt:book-1',
      '1700000000000',
    );
    expect(startJobLiveActivityNative).toHaveBeenCalledWith({
      bookingId: 'book-1',
      customerName: 'Ana',
      serviceName: 'Interior',
      startedAtMs: 1_700_000_000_000,
    });

    Date.now.mockRestore();
  });

  it('reuses a persisted start time on restore', async () => {
    AsyncStorage.getItem.mockResolvedValue('1690000000000');

    await startJobLiveActivity({
      id: 'book-1',
      customer_name: 'Ana',
      service_name: 'Interior',
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(startJobLiveActivityNative).toHaveBeenCalledWith(
      expect.objectContaining({ startedAtMs: 1_690_000_000_000 }),
    );
  });

  it('skips native start when the Live Activity module is not in the binary', async () => {
    isJobLiveActivityNativeModuleLinked.mockReturnValue(false);

    const result = await startJobLiveActivity({ id: 'book-1', customer_name: 'Ana' });

    expect(result).toEqual({ ok: false, reason: 'module_missing' });
    expect(startJobLiveActivityNative).not.toHaveBeenCalled();
  });

  it('clears the persisted start and ends the native timer', async () => {
    await endJobLiveActivity('book-1');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@servicelink/jobLiveActivity.startedAt:book-1',
    );
    expect(endJobLiveActivityNative).toHaveBeenCalledWith('book-1');
  });
});
