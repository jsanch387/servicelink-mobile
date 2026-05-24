import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { EchoBarsLoader } from './EchoBarsLoader';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';

/**
 * Shared pending state while an async submit is in flight.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.accessibilityLabel]
 * @param {boolean} [props.card]
 */
export function SubmitOutcomePending({
  title = 'Sending',
  accessibilityLabel = 'Sending',
  card = false,
}) {
  const { colors } = useTheme();

  const content = (
    <View style={card ? styles.cardWrap : styles.wrap}>
      <EchoBarsLoader accessibilityLabel={accessibilityLabel} />
      <AppText style={[styles.title, { color: colors.text }]}>{title}</AppText>
    </View>
  );

  if (card) {
    return <SurfaceCard style={styles.card}>{content}</SurfaceCard>;
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    minHeight: 200,
  },
  cardWrap: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 32,
  },
  wrap: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
});
