import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {import('react').ReactNode} props.children
 * @param {'default' | 'overline'} [props.titleTone]
 * @param {'default' | 'roomy'} [props.bodyPadding]
 */
export function DetailsSectionCard({
  title,
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
      titleDefault: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      titleOverline: {
        color: colors.textMuted,
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

  return (
    <View style={styles.section}>
      {title ? (
        <AppText style={isOverline ? styles.titleOverline : styles.titleDefault}>{title}</AppText>
      ) : null}
      <SurfaceCard style={isRoomy ? styles.cardRoomy : styles.cardDefault}>{children}</SurfaceCard>
    </View>
  );
}
