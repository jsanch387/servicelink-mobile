export { BUFFER_TIME_OPTIONS } from '../utils/availabilityModel';

export const BOOKING_WINDOWS_TITLE = 'Booking timing';

export const LEAD_TIME_ROW = {
  title: 'Lead time',
  hint: 'How far ahead customers have to book.',
  noneLabel: 'No lead time',
  infoLabel: 'About lead time',
};

export const BUFFER_TIME_ROW = {
  title: 'Buffer time',
  hint: 'A gap between your appointments.',
  noneLabel: 'No buffer time',
  infoLabel: 'About buffer time',
};

export const LEAD_TIME_HOW_IT_WORKS = {
  title: 'How lead time works',
  intro:
    'Lead time is how far ahead a customer has to book. It keeps last-minute requests off your calendar.',
  items: [
    {
      icon: 'today-outline',
      title: 'No same-day bookings',
      body: 'Set lead time to 1 day if you do not take same-day appointments. Customers can only pick tomorrow or later.',
    },
    {
      icon: 'calendar-outline',
      title: 'A couple of days out',
      body: 'Set it to 2 days and they must book at least two days ahead. 3 days works the same way.',
    },
    {
      icon: 'flash-outline',
      title: 'No lead time',
      body: 'None means they can grab the next open slot — even if that is later today.',
    },
  ],
  optionalNote:
    'You can still add a last-minute appointment yourself. Lead time only applies to customers booking online.',
};

export const BUFFER_TIME_HOW_IT_WORKS = {
  title: 'How buffer time works',
  intro:
    'Buffer time is a short gap after each appointment so you can reset before the next customer.',
  items: [
    {
      icon: 'sparkles-outline',
      title: 'Time to reset',
      body: 'Use it for cleanup, packing up, or a breather between jobs.',
    },
    {
      icon: 'time-outline',
      title: 'A 9:00 example',
      body: 'A 9:00 appointment that lasts an hour ends at 10:00. With a 30-minute buffer, customers cannot book 10:00 — the next open time is 10:30.',
    },
    {
      icon: 'calendar-outline',
      title: 'How it affects availability',
      body: 'That gap is blocked automatically. Your weekly hours stay the same; people just cannot start a visit during the buffer.',
    },
  ],
  optionalNote: 'None means the next customer can book right when the last job ends.',
};
