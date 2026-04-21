import { View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Neutral placeholder block for skeleton loading states.
 * @param {object} props
 * @param {number} [props.height]
 * @param {number|string} [props.width] — number (dp) or percentage string
 * @param {number} [props.borderRadius]
 * @param {string} [props.backgroundColor] — override token (e.g. spotlight card bones)
 */
export function SkeletonBox({
  height = 14,
  width = '100%',
  borderRadius = 8,
  backgroundColor,
  style,
}) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.border;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius,
          height,
          opacity: 0.42,
          width,
        },
        style,
      ]}
    />
  );
}
