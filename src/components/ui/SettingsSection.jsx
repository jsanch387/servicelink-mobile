import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';

/**
 * Section label + card shell for grouped settings rows.
 * @param {object} props
 * @param {string} [props.title]
 * @param {import('react').ReactNode} [props.titleRight]
 * @param {import('react').ReactNode} props.children
 * @param {boolean} [props.first]
 */
export function SettingsSection({ title, titleRight = null, children, first = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignSelf: 'stretch',
          marginTop: first ? 0 : 22,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
          marginBottom: 8,
          minHeight: 22,
        },
        label: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          minWidth: 0,
        },
        titleRight: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
        },
        card: {
          overflow: 'hidden',
        },
      }),
    [colors, first],
  );

  const showTitleRow = Boolean(title || titleRight);

  return (
    <View style={styles.wrap}>
      {showTitleRow ? (
        <View style={styles.titleRow}>
          {title ? <AppText style={styles.label}>{title}</AppText> : <View />}
          {titleRight ? <View style={styles.titleRight}>{titleRight}</View> : null}
        </View>
      ) : null}
      <SurfaceCard padding="none" style={styles.card}>
        {children}
      </SurfaceCard>
    </View>
  );
}
