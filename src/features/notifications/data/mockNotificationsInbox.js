/** Mock inbox rows until notifications API is wired. */
export const MOCK_NOTIFICATIONS_INBOX = [
  {
    id: 'n1',
    type: 'booking',
    title: 'New booking request',
    body: 'Sarah M. requested Friday at 2:00 PM.',
    time: '2m ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'booking',
    title: 'Appointment canceled',
    body: 'Mike T. canceled tomorrow at 9:30 AM.',
    time: '45m ago',
    unread: true,
  },
  {
    id: 'n3',
    type: 'payment',
    title: 'Payment received',
    body: 'A $140 payment was completed for Booking #1837.',
    time: 'Today',
    unread: false,
  },
  {
    id: 'n4',
    type: 'booking',
    title: 'Appointment rescheduled',
    body: 'A customer moved from Monday 3:00 PM to Tuesday 10:00 AM.',
    time: 'Yesterday',
    unread: false,
  },
];
