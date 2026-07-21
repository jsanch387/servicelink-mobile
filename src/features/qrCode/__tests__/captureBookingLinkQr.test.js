import {
  captureBookingLinkQr,
  saveBookingLinkQrToLibrary,
  shareBookingLinkQr,
} from '../utils/captureBookingLinkQr';

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

const MediaLibrary = require('expo-media-library');
const Sharing = require('expo-sharing');
const { captureRef } = require('react-native-view-shot');

describe('captureBookingLinkQr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures a PNG tmpfile at export size', async () => {
    captureRef.mockResolvedValue('file:///tmp/qr.png');
    const uri = await captureBookingLinkQr({ current: {} });
    expect(uri).toBe('file:///tmp/qr.png');
    expect(captureRef).toHaveBeenCalledWith(
      { current: {} },
      expect.objectContaining({
        format: 'png',
        width: 1024,
        height: 1024,
      }),
    );
  });

  it('throws when the view is not ready', async () => {
    await expect(captureBookingLinkQr({ current: null })).rejects.toThrow(/not ready/i);
  });
});

describe('shareBookingLinkQr', () => {
  it('shares when available', async () => {
    Sharing.isAvailableAsync.mockResolvedValue(true);
    Sharing.shareAsync.mockResolvedValue(undefined);
    await shareBookingLinkQr('file:///tmp/qr.png');
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///tmp/qr.png',
      expect.objectContaining({ mimeType: 'image/png' }),
    );
  });

  it('throws when sharing is unavailable', async () => {
    Sharing.isAvailableAsync.mockResolvedValue(false);
    await expect(shareBookingLinkQr('file:///tmp/qr.png')).rejects.toThrow(/not available/i);
  });
});

describe('saveBookingLinkQrToLibrary', () => {
  it('saves after permission is granted', async () => {
    MediaLibrary.requestPermissionsAsync.mockResolvedValue({ granted: true });
    MediaLibrary.createAssetAsync.mockResolvedValue({ id: 'asset-1' });
    await expect(saveBookingLinkQrToLibrary('file:///tmp/qr.png')).resolves.toBe('asset-1');
  });

  it('throws when permission is denied', async () => {
    MediaLibrary.requestPermissionsAsync.mockResolvedValue({ granted: false });
    await expect(saveBookingLinkQrToLibrary('file:///tmp/qr.png')).rejects.toThrow(
      /photo library/i,
    );
  });
});
