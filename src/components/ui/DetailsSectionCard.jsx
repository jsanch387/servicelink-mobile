import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {import('react').ReactNode} [props.titleRight] — action on the title row (outside the card)
 * @param {import('react').ReactNode} props.children
 * @param {'default' | 'overline'} [props.titleTone]
 * @param {'default' | 'roomy'} [props.bodyPadding]
 */
export function DetailsSectionCard({
  title,
  titleRight = null,
  children,
  titleTone = 'default',
  bodyPadding = 'default',
}) {
  const { colors } = useTheme();

  const styles = useMemo(() => {
    const isOverline = titleTone === 'overline';

    return StyleSheet.create({
      section: {
        rowGap: isOverline ? 10 : 8,
      },
      titleRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 22,
      },
      titleDefault: {
        color: colors.textSecondary,
        flexShrink: 1,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      titleOverline: {
        color: colors.textMuted,
        flexShrink: 1,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
      },
      cardDefault: {
        paddingHorizontal: 14,
        paddingVertical: 12,
      },
      cardRoomy: {
        paddingHorizontal: 16,
        paddingVertical: 16,
      },
    });
  }, [colors, titleTone]);

  const isOverline = titleTone === 'overline';
  const isRoomy = bodyPadding === 'roomy';
  const showTitleRow = Boolean(title || titleRight);

  return (
    <View style={styles.section}>
      {showTitleRow ? (
        <View style={styles.titleRow}>
          {title ? (
            <AppText style={isOverline ? styles.titleOverline : styles.titleDefault}>
              {title}
            </AppText>
          ) : (
            <View />
          )}
          {titleRight}
        </View>
      ) : null}
      <SurfaceCard style={isRoomy ? styles.cardRoomy : styles.cardDefault}>{children}</SurfaceCard>
    </View>
  );
}
