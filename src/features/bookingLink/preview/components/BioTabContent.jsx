import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function BioTabContent({ bio }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 21,
          paddingHorizontal: 2,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <AppText style={styles.body}>{bio || 'No bio added yet.'}</AppText>
    </View>
  );
}
