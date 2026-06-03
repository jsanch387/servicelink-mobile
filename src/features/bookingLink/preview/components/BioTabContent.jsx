import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function BioTabContent({ bio, businessType = '' }) {
  const { colors } = useTheme();
  const businessTypeLabel = businessType.trim();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        businessType: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 2.6,
          marginBottom: 12,
          paddingHorizontal: 2,
          textTransform: 'uppercase',
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
      {businessTypeLabel ? (
        <AppText style={styles.businessType}>{businessTypeLabel}</AppText>
      ) : null}
      <AppText style={styles.body}>{bio || 'No bio added yet.'}</AppText>
    </View>
  );
}
