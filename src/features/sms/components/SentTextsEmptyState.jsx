import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * @param {{
 *   title?: string;
 *   detail?: string;
 * }} props
 */
export function SentTextsEmptyState({
  title = 'No messages sent yet',
  detail = 'Customer message notifications will show up here.',
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 96,
          paddingHorizontal: 28,
          paddingTop: 24,
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderRadius: 999,
          height: 72,
          justifyContent: 'center',
          marginBottom: 18,
          width: 72,
        },
        title: {
          color: colors.textMuted,
          fontSize: 18,
          fontWeight: '500',
          letterSpacing: -0.25,
          textAlign: 'center',
        },
        detail: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
          marginTop: 8,
          opacity: 0.85,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.iconRing}>
        <Ionicons color={colors.textMuted} name="chatbubble-ellipses-outline" size={30} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.detail}>{detail}</AppText>
    </View>
  );
}
