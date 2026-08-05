import {
  SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION,
  SMS_MESSAGE_TYPE_JOB_COMPLETED,
  SMS_MESSAGE_TYPE_JOB_STARTED,
  SMS_MESSAGE_TYPE_ON_THE_WAY,
  SMS_MESSAGE_TYPE_WORK_FINISHED,
} from '../constants/smsMessageTypes';
import { buildCustomerSmsPreviewMessages } from '../utils/buildCustomerSmsPreviewMessages';
import { smsMessageTypeIcon, smsMessageTypeIconColor } from '../utils/smsMessagePresentation';

describe('buildCustomerSmsPreviewMessages', () => {
  it('includes lifecycle samples with types and uses the business name for on-the-way', () => {
    const messages = buildCustomerSmsPreviewMessages('Acme Detail');
    expect(messages).toEqual([
      expect.objectContaining({
        type: SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION,
        body: expect.stringMatching(/appointment is confirmed/i),
      }),
      expect.objectContaining({
        type: SMS_MESSAGE_TYPE_ON_THE_WAY,
        body: expect.stringContaining('Acme Detail is on the way'),
      }),
      expect.objectContaining({
        type: SMS_MESSAGE_TYPE_JOB_STARTED,
        body: 'Your service has started.',
      }),
      expect.objectContaining({
        type: SMS_MESSAGE_TYPE_WORK_FINISHED,
        body: 'Your service is finished and ready for you.',
      }),
      expect.objectContaining({
        type: SMS_MESSAGE_TYPE_JOB_COMPLETED,
        body: expect.stringMatching(/receipt is ready/i),
      }),
    ]);
  });

  it('falls back when business name is missing', () => {
    expect(buildCustomerSmsPreviewMessages(null)[1].body).toContain('Your business is on the way');
  });

  it('maps each preview type to the timeline icons and accent colors', () => {
    const messages = buildCustomerSmsPreviewMessages('Acme');
    expect(messages.map((m) => smsMessageTypeIcon(m.type))).toEqual([
      'checkmark-circle-outline',
      'navigate-outline',
      'play-outline',
      'flag-outline',
      'ribbon-outline',
    ]);
    expect(messages.map((m) => smsMessageTypeIconColor(m.type))).toEqual([
      '#34c759',
      '#0a84ff',
      '#10b981',
      '#f59e0b',
      '#a78bfa',
    ]);
  });
});
