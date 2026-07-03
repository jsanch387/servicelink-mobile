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
