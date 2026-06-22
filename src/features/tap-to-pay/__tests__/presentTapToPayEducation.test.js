import { Platform } from 'react-native';
import {
  isTapToPayEducationAvailable,
  presentTapToPayEducation,
} from '../native/presentTapToPayEducation';

jest.mock('servicelink-tap-to-pay-education', () => ({
  isTapToPayEducationNativeAvailable: jest.fn(() => true),
  isTapToPayEducationNativeModuleLinked: jest.fn(() => true),
  presentTapToPayEducationNative: jest.fn(() => Promise.resolve()),
}));

jest.mock('../education/tapToPayEducationStorage', () => ({
  markTapToPayEducationSeen: jest.fn(() => Promise.resolve()),
  clearTapToPayEducationSeen: jest.fn(() => Promise.resolve()),
  hasSeenTapToPayEducation: jest.fn(() => Promise.resolve(false)),
}));

const { markTapToPayEducationSeen } = require('../education/tapToPayEducationStorage');

const {
  isTapToPayEducationNativeAvailable,
  presentTapToPayEducationNative,
} = require('servicelink-tap-to-pay-education');

describe('presentTapToPayEducation', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  it('returns false off iOS', () => {
    Platform.OS = 'android';
    expect(isTapToPayEducationAvailable()).toBe(false);
  });

  it('delegates availability to native module on iOS', () => {
    Platform.OS = 'ios';
    isTapToPayEducationNativeAvailable.mockReturnValue(true);
    expect(isTapToPayEducationAvailable()).toBe(true);
  });

  it('presents native education on iOS', async () => {
    Platform.OS = 'ios';
    await presentTapToPayEducation();
    expect(presentTapToPayEducationNative).toHaveBeenCalledTimes(1);
    expect(markTapToPayEducationSeen).toHaveBeenCalledTimes(1);
  });

  it('can present without marking seen (dev preview)', async () => {
    Platform.OS = 'ios';
    await presentTapToPayEducation({ markSeen: false });
    expect(presentTapToPayEducationNative).toHaveBeenCalledTimes(1);
    expect(markTapToPayEducationSeen).not.toHaveBeenCalled();
  });
});
