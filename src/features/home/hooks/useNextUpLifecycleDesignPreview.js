import { useCallback, useMemo, useState } from 'react';
import { JOB_STATUS, WORK_HANDOFF_STATUS } from '../../bookings/constants/jobStatus';
import { phoneForSmsUri } from '../../../utils/phone';
import {
  NEXT_UP_LIFECYCLE_DESIGN_MOCK_BOOKING,
  NEXT_UP_LIFECYCLE_DESIGN_SUBTITLES,
} from '../constants/nextUpLifecycleDesignMock';
import { resolveNextUpWorkingPhase } from '../utils/resolveNextUpCardActions';

const DESIGN_SEND_MS = 700;

function firstNameFromCustomerName(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(/\s+/)[0] ?? '';
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Local state machine for the Next Up lifecycle design preview (no API).
 */
export function useNextUpLifecycleDesignPreview() {
  const [isActive, setIsActive] = useState(false);
  const [jobStatus, setJobStatus] = useState(JOB_STATUS.NOT_STARTED);
  const [workHandoffStatus, setWorkHandoffStatus] = useState(
    /** @type {null | 'notified' | 'skipped'} */ (null),
  );
  const [isSending, setIsSending] = useState(false);
  const [completeSheetVisible, setCompleteSheetVisible] = useState(false);

  const reset = useCallback(() => {
    setJobStatus(JOB_STATUS.NOT_STARTED);
    setWorkHandoffStatus(null);
    setIsSending(false);
    setCompleteSheetVisible(false);
  }, []);

  const start = useCallback(() => {
    reset();
    setIsActive(true);
  }, [reset]);

  const stop = useCallback(() => {
    setIsActive(false);
    reset();
  }, [reset]);

  const runDesignAction = useCallback(
    async (action) => {
      if (isSending) {
        return;
      }
      setIsSending(true);
      await delay(DESIGN_SEND_MS);
      setIsSending(false);

      if (action === 'on_the_way') {
        setJobStatus(JOB_STATUS.ON_THE_WAY);
      } else if (action === 'job_started') {
        setJobStatus(JOB_STATUS.IN_PROGRESS);
        setWorkHandoffStatus(null);
      } else if (action === 'work_finished_notify') {
        setWorkHandoffStatus(WORK_HANDOFF_STATUS.NOTIFIED);
      }
    },
    [isSending],
  );

  const requestOnMyWay = useCallback(() => {
    void runDesignAction('on_the_way');
  }, [runDesignAction]);

  const requestStartJob = useCallback(() => {
    void runDesignAction('job_started');
  }, [runDesignAction]);

  const requestWorkFinishedNotify = useCallback(() => {
    void runDesignAction('work_finished_notify');
  }, [runDesignAction]);

  const skipWorkNotify = useCallback(() => {
    setWorkHandoffStatus(WORK_HANDOFF_STATUS.SKIPPED);
  }, []);

  const booking = useMemo(
    () => ({
      ...NEXT_UP_LIFECYCLE_DESIGN_MOCK_BOOKING,
      job_status: jobStatus,
      work_handoff_status: workHandoffStatus,
    }),
    [jobStatus, workHandoffStatus],
  );

  const subtitle = NEXT_UP_LIFECYCLE_DESIGN_SUBTITLES[jobStatus] ?? '';
  const customerFirstName = firstNameFromCustomerName(booking.customer_name);
  const hasSmsPhone = Boolean(phoneForSmsUri(booking.customer_phone));

  const workingPhase = useMemo(
    () => resolveNextUpWorkingPhase(jobStatus, workHandoffStatus) ?? 'ready',
    [jobStatus, workHandoffStatus],
  );

  const openCompleteSheet = useCallback(() => {
    setCompleteSheetVisible(true);
  }, []);

  const closeCompleteSheet = useCallback(() => {
    setCompleteSheetVisible(false);
  }, []);

  const actionHandlers = useMemo(
    () => ({
      onOnMyWay: requestOnMyWay,
      onStartJob: requestStartJob,
      isSending,
      disabled: isSending,
    }),
    [isSending, requestOnMyWay, requestStartJob],
  );

  return {
    isActive,
    start,
    stop,
    reset,
    booking,
    subtitle,
    customerFirstName,
    hasSmsPhone,
    workingPhase,
    isSending,
    completeSheetVisible,
    actionHandlers,
    requestWorkFinishedNotify,
    skipWorkNotify,
    openCompleteSheet,
    closeCompleteSheet,
  };
}
