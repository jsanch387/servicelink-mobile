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

/** Multi-job: hub for editing one selected job (service / price / vehicle). */
export const EDIT_APPOINTMENT_JOB_HUB = -3;

/** Visit-level notes only (vehicles live on each job). */
export const EDIT_APPOINTMENT_NOTES = -4;

/**
 * Visit-hub entry for Add-ons. Opens the add-ons step for a single catalog job,
 * or a job picker when multiple catalog jobs exist.
 */
export const EDIT_APPOINTMENT_ADDONS_ENTRY = -5;

/** Pick which job’s add-ons to edit (multi-job). */
export const EDIT_APPOINTMENT_ADDONS_JOBS_LIST = -6;

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
