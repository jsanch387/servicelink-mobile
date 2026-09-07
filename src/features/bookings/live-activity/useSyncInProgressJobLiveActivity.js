import { useEffect } from 'react';
import { JOB_STATUS, normalizeJobStatus } from '../constants/jobStatus';
import { endJobLiveActivity, startJobLiveActivity } from './jobLiveActivity';

/**
 * Keeps the Dynamic Island / Lock Screen timer aligned with Home's in-progress job
 * (app relaunch, spotlight still working).
 *
 * @param {Record<string, unknown> | null | undefined} booking
 */
export function useSyncInProgressJobLiveActivity(booking) {
  const bookingId = String(booking?.id ?? '').trim();
  const jobStatus = normalizeJobStatus(booking?.job_status);
  const customerName = String(booking?.customer_name ?? '').trim();
  const serviceName = String(booking?.service_name ?? '').trim();

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }
    if (jobStatus === JOB_STATUS.IN_PROGRESS) {
      void startJobLiveActivity({
        id: bookingId,
        customer_name: customerName,
        service_name: serviceName,
      });
      return undefined;
    }
    if (jobStatus === JOB_STATUS.COMPLETED) {
      void endJobLiveActivity(bookingId);
    }
    return undefined;
  }, [bookingId, customerName, jobStatus, serviceName]);
}
