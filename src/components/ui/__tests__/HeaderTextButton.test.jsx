import { Platform } from 'react-native';
import {
  HEADER_BAR_SIDE_SLOT_WIDTH,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../HeaderTextButton';

describe('android header title balance', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('leaves iOS header actions unchanged so glass capsules stay native', () => {
    Platform.OS = 'ios';
    const renderLeft = () => 'left';
    expect(androidBalancedHeaderLeft(renderLeft)).toBe(renderLeft);
    expect(androidHeaderTitleBalanceRight()).toBeUndefined();
  });

  it('pairs equal-width side slots on Android', () => {
    Platform.OS = 'android';
    const renderLeft = () => 'left';
    const balancedLeft = androidBalancedHeaderLeft(renderLeft);
    const balancedRight = androidHeaderTitleBalanceRight();

    expect(balancedLeft).not.toBe(renderLeft);
    expect(typeof balancedRight).toBe('function');
    expect(HEADER_BAR_SIDE_SLOT_WIDTH).toBeGreaterThanOrEqual(80);
  });
});
