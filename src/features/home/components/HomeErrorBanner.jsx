import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';

/**
 * Single home-screen connection / load failure line (no nested error card chrome).
 */
export function HomeErrorBanner({ message }) {
  const { colors, isDark } = useTheme();
  const copy = safeUserFacingMessage(message);

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.row,
        {
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.07)',
          borderColor: colors.danger,
        },
      ]}
    >
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={22} />
      <AppText style={[styles.text, { color: colors.danger }]}>{copy}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
