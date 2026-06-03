import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { REVIEWS_EMPTY_STATE_COPY } from '../constants';

export function ReviewsEmptyState() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 36,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          marginTop: 8,
          maxWidth: 280,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>{REVIEWS_EMPTY_STATE_COPY.title}</AppText>
      <AppText style={styles.body}>{REVIEWS_EMPTY_STATE_COPY.body}</AppText>
    </View>
  );
}
