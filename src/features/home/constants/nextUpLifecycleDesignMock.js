import { JOB_STATUS } from '../../bookings/constants/jobStatus';

/** Static mock booking for the Next Up lifecycle design preview (no API). */
export const NEXT_UP_LIFECYCLE_DESIGN_MOCK_BOOKING = {
  id: 'design-next-up-lifecycle',
  customer_id: 'design-customer-1',
  customer_name: 'Maria Santos',
  customer_phone: '5558675309',
  customer_email: 'maria@email.com',
  service_name: 'Full Detail — SUV',
  job_status: JOB_STATUS.NOT_STARTED,
  scheduled_date: '2026-06-17',
  start_time: '14:00:00',
  customer_street_address: '742 Evergreen Terrace',
  customer_city: 'Austin',
  customer_state: 'TX',
  customer_zip: '78704',
  customer_vehicle_year: '2021',
  customer_vehicle_make: 'BMW',
  customer_vehicle_model: 'X5',
};

/** @type {Record<string, string>} */
export const NEXT_UP_LIFECYCLE_DESIGN_SUBTITLES = {
  [JOB_STATUS.NOT_STARTED]: 'Today at 2:00 PM',
  [JOB_STATUS.ON_THE_WAY]: 'On the way',
  [JOB_STATUS.IN_PROGRESS]: 'Started at 2:00 PM',
  [JOB_STATUS.COMPLETED]: 'Completed at 3:40 PM',
};
