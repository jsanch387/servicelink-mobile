import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { REVIEW_STAR_COLOR } from '../constants';

const STAR_COUNT = 5;

/**
 * @param {{ rating: number; size?: number; gap?: number }} props
 */
export function StarRating({ rating, size = 16, gap = 2 }) {
  const { colors } = useTheme();

  const filledCount = useMemo(() => {
    const clamped = Math.max(0, Math.min(STAR_COUNT, Math.round(rating)));
    return clamped;
  }, [rating]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap,
        },
      }),
    [gap],
  );

  return (
    <View accessibilityLabel={`${filledCount} out of ${STAR_COUNT} stars`} style={styles.row}>
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const filled = index < filledCount;
        return (
          <Ionicons
            key={index}
            color={filled ? REVIEW_STAR_COLOR : colors.borderStrong}
            name={filled ? 'star' : 'star-outline'}
            size={size}
          />
        );
      })}
    </View>
  );
}
