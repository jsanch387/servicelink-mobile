import { CREATE_APPOINTMENT_STEP_META } from '../create-appointment/constants';

export {
  CREATE_APPOINTMENT_LAST_STEP as EDIT_APPOINTMENT_LAST_STEP,
  CREATE_APPOINTMENT_STEP as EDIT_APPOINTMENT_STEP,
  createAppointmentStepShowsMainTitle as editAppointmentStepShowsMainTitle,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
} from '../create-appointment/constants';

/** Hub index — pick a section before jumping into a single wizard step. */
export const EDIT_APPOINTMENT_HUB = -1;

/** Multi-job: list of jobs on this appointment. */
export const EDIT_APPOINTMENT_JOBS_LIST = -2;

/** Multi-job: hub for editing one selected job (service / price / add-ons / vehicle). */
export const EDIT_APPOINTMENT_JOB_HUB = -3;

/** Multi-job: visit-level notes only (vehicles live on each job). */
export const EDIT_APPOINTMENT_NOTES = -4;

/** Same wizard steps as create; review copy is edit-specific. */
export const EDIT_APPOINTMENT_STEP_META = CREATE_APPOINTMENT_STEP_META.map((entry) =>
  entry.key === 'review'
    ? {
        ...entry,
        title: 'Review changes',
        subtitle: 'Confirm your updates, then save the appointment.',
      }
    : entry,
);
