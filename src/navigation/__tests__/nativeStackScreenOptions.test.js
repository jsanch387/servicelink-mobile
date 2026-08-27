import { FONT_FAMILIES } from '../../theme';
import {
  NATIVE_STACK_HEADER_TITLE_ALIGN,
  nativeStackScreenOptions,
} from '../nativeStackScreenOptions';

describe('nativeStackScreenOptions', () => {
  it('centers the header title so Android matches iOS', () => {
    const options = nativeStackScreenOptions({
      colors: { shell: '#f5f5f5' },
    });

    expect(NATIVE_STACK_HEADER_TITLE_ALIGN).toBe('center');
    expect(options.headerTitleAlign).toBe('center');
    expect(options.headerTitleStyle).toEqual({ fontFamily: FONT_FAMILIES.semibold });
    expect(options.contentStyle).toEqual({ backgroundColor: '#f5f5f5' });
    expect(options.animation).toBe('slide_from_right');
  });
});
