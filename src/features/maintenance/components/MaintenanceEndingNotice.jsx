import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EndingLabel, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MAINTENANCE_SUNSET_NOTICE_BODY, MAINTENANCE_SUNSET_NOTICE_TITLE } from '../constants';

export function MaintenanceEndingNotice() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: 0,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        pillCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 8,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <AppText style={styles.title}>{MAINTENANCE_SUNSET_NOTICE_TITLE}</AppText>
        </View>
        <View style={styles.pillCol}>
          <EndingLabel style={{ marginLeft: 0 }} />
        </View>
      </View>
      <AppText style={styles.body}>{MAINTENANCE_SUNSET_NOTICE_BODY}</AppText>
    </SurfaceCard>
  );
}
