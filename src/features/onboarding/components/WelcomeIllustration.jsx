import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../../theme';

/** Seven day columns. Every mark on the page shares x = 120. */
const COLUMNS = [54, 76, 98, 120, 142, 164, 186];
const ROWS = [90, 110, 130, 150];

/**
 * Two palettes for the same drawing.
 * The app is dark-only today, and the white calendar is the one we show.
 * `dark` stays for when a light theme exists.
 */
const PALETTES = {
  light: {
    ink: '#171717',
    onInk: '#ffffff',
    page: '#ffffff',
    edge: '#ececec',
    day: '#e4e4e4',
    weekday: '#d2d2d2',
    timeOpacity: 0.45,
  },
  dark: {
    ink: '#f4f4f4',
    onInk: '#1a1a1a',
    page: '#161616',
    edge: '#161616',
    day: '#333333',
    weekday: '#3f3f3f',
    timeOpacity: 0.4,
  },
};

const PALETTE = PALETTES.light;

/**
 * Welcome mark: one white calendar, a marked day, and the booking on that page.
 */
export function WelcomeIllustration() {
  const { colors } = useTheme();
  const { ink, onInk, page, edge, day, weekday, timeOpacity } = PALETTE;

  return (
    <Svg
      accessibilityElementsHidden
      height={228}
      importantForAccessibility="no-hide-descendants"
      viewBox="0 0 240 228"
      width={240}
    >
      <Ellipse cx={120} cy={218} fill="#000" fillOpacity={0.28} rx={76} ry={6} />

      <Circle cx={92} cy={26} fill={colors.shell} r={11} stroke={ink} strokeWidth={2.5} />
      <Circle cx={148} cy={26} fill={colors.shell} r={11} stroke={ink} strokeWidth={2.5} />

      <Rect
        fill={page}
        height={186}
        rx={32}
        stroke={edge}
        strokeWidth={1}
        width={192}
        x={24}
        y={26}
      />
      <Path d="M56 26 H184 A32 32 0 0 1 216 58 V62 H24 V58 A32 32 0 0 1 56 26 Z" fill={ink} />
      <Path
        d="M76 38 L68 44 L76 50"
        fill="none"
        stroke={onInk}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
      <Path
        d="M164 38 L172 44 L164 50"
        fill="none"
        stroke={onInk}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
      <Rect fill={onInk} height={8} rx={4} width={44} x={98} y={40} />

      {COLUMNS.map((colX) => (
        <Rect
          key={`weekday-${colX}`}
          fill={weekday}
          height={3}
          rx={1.5}
          width={10}
          x={colX - 5}
          y={74}
        />
      ))}

      {ROWS.map((rowY) =>
        COLUMNS.map((colX) => {
          if (colX === 120 && rowY === 110) return null;
          return <Circle key={`${colX}-${rowY}`} cx={colX} cy={rowY} fill={day} r={4.5} />;
        }),
      )}
      <Circle cx={120} cy={110} fill={ink} r={7.5} />

      <Rect fill={ink} height={34} rx={14} width={164} x={38} y={166} />
      <Circle cx={58} cy={183} fill="none" r={6.5} stroke={onInk} strokeWidth={1.6} />
      <Path
        d="M58 183 V177.8 M58 183 L61.8 185"
        fill="none"
        stroke={onInk}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      <Rect fill={onInk} height={6} rx={3} width={96} x={74} y={175} />
      <Rect fill={onInk} fillOpacity={timeOpacity} height={4} rx={2} width={58} x={74} y={186} />
    </Svg>
  );
}
