import { maybePresentTapToPayEducationAfterConnect } from '../education/maybePresentTapToPayEducationAfterConnect';

jest.mock('../native/presentTapToPayEducation', () => ({
  isTapToPayEducationAvailable: jest.fn(() => true),
  markTapToPayEducationSeen: jest.fn(() => Promise.resolve()),
  presentTapToPayEducation: jest.fn(() => Promise.resolve()),
}));

jest.mock('../education/tapToPayEducationStorage', () => ({
  hasSeenTapToPayEducation: jest.fn(() => Promise.resolve(false)),
}));

const {
  isTapToPayEducationAvailable,
  markTapToPayEducationSeen,
  presentTapToPayEducation,
} = require('../native/presentTapToPayEducation');
const { hasSeenTapToPayEducation } = require('../education/tapToPayEducationStorage');

describe('maybePresentTapToPayEducationAfterConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isTapToPayEducationAvailable.mockReturnValue(true);
    hasSeenTapToPayEducation.mockResolvedValue(false);
    presentTapToPayEducation.mockResolvedValue(undefined);
  });

  it('skips when unavailable', async () => {
    isTapToPayEducationAvailable.mockReturnValue(false);

    await expect(maybePresentTapToPayEducationAfterConnect()).resolves.toEqual({
      presented: false,
      reason: 'unavailable',
    });
    expect(presentTapToPayEducation).not.toHaveBeenCalled();
  });

  it('skips when already seen', async () => {
    hasSeenTapToPayEducation.mockResolvedValue(true);

    await expect(maybePresentTapToPayEducationAfterConnect()).resolves.toEqual({
      presented: false,
      reason: 'already_seen',
    });
    expect(presentTapToPayEducation).not.toHaveBeenCalled();
  });

  it('presents once after connect', async () => {
    await expect(maybePresentTapToPayEducationAfterConnect()).resolves.toEqual({
      presented: true,
    });
    expect(markTapToPayEducationSeen).toHaveBeenCalledTimes(1);
    expect(presentTapToPayEducation).toHaveBeenCalledWith({ markSeen: false });
  });

  it('marks seen before presenting so dismiss does not re-trigger auto flow', async () => {
    presentTapToPayEducation.mockRejectedValue(new Error('dismissed'));

    await expect(maybePresentTapToPayEducationAfterConnect()).resolves.toEqual({
      presented: false,
      reason: 'error',
      message: 'dismissed',
    });
    expect(markTapToPayEducationSeen).toHaveBeenCalledTimes(1);
  });
});
