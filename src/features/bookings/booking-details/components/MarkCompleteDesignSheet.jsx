import { useCallback, useMemo, useState } from 'react';
import { useToast } from '../../../../components/ui';
import { JOB_COMPLETED_SUCCESS_SMS } from '../../utils/bookingActionFeedback';
import { MARK_COMPLETE_DESIGN_MOCK_BOOKING } from '../constants/markCompleteDesignMock';
import { getMarkCompletePreviewFromBooking } from '../utils/markCompletePreview';
import { BookingMarkCompleteSheet } from './BookingMarkCompleteSheet';

const DESIGN_SUBMIT_MS = 750;

/**
 * Dev-only design preview: confirm sheet → simulated submit → review-link SMS toast.
 *
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function MarkCompleteDesignSheet({ visible, onRequestClose }) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(
    () => getMarkCompletePreviewFromBooking(MARK_COMPLETE_DESIGN_MOCK_BOOKING),
    [],
  );

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => {
      setTimeout(resolve, DESIGN_SUBMIT_MS);
    });
    setIsSubmitting(false);
    onRequestClose();
    toast.sms(JOB_COMPLETED_SUCCESS_SMS, { type: 'success' });
  }, [onRequestClose, toast]);

  return (
    <BookingMarkCompleteSheet
      isSubmitting={isSubmitting}
      preview={preview}
      visible={visible}
      onConfirm={() => void handleConfirm()}
      onRequestClose={onRequestClose}
    />
  );
}
