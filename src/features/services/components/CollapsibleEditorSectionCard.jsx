import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function CollapsibleEditorSectionCard({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  contentStyle,
}) {
  const { colors } = useTheme();

  return (
    <SurfaceCard padding="none" style={[styles.card, { borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.header}>
        <View style={styles.headerTextWrap}>
          <AppText style={[styles.title, { color: colors.text }]}>{title}</AppText>
          {subtitle ? (
            <AppText style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</AppText>
          ) : null}
        </View>
        <Ionicons
          color={colors.textMuted}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={28}
        />
      </Pressable>
      {expanded ? (
        <View style={[styles.content, { borderTopColor: colors.border }, contentStyle]}>
          {children}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
});
