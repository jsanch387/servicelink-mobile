import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * @param {{
 *   visible: boolean;
 *   onRequestClose: () => void;
 *   title: string;
 *   intro: string;
 *   items: Array<{ icon: import('@expo/vector-icons').IconProps['name']; title: string; body: string }>;
 *   optionalNote?: string;
 *   dismissLabel?: string;
 * }} props
 */
export function CatalogFeatureHowItWorksSheet({
  visible,
  onRequestClose,
  title,
  intro,
  items,
  optionalNote,
  dismissLabel = 'Got it',
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
          marginBottom: 10,
        },
        listCard: {
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          overflow: 'hidden',
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          paddingHorizontal: 10,
          paddingVertical: 10,
        },
        rowDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 48,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          height: 28,
          justifyContent: 'center',
          marginRight: 10,
          width: 28,
        },
        rowText: {
          flex: 1,
          minWidth: 0,
        },
        rowTitle: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.15,
          lineHeight: 17,
        },
        rowBody: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 17,
          marginTop: 2,
        },
        optionalNote: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          marginTop: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        optionalText: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 17,
        },
        footer: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button fullWidth title={dismissLabel} variant="secondary" onPress={onRequestClose} />
        </View>
      }
      title={title}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <AppText style={styles.intro}>{intro}</AppText>

      <View style={styles.listCard}>
        {items.map((item, index) => (
          <View key={item.title}>
            {index > 0 ? <View style={styles.rowDivider} /> : null}
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons color={colors.textSecondary} name={item.icon} size={15} />
              </View>
              <View style={styles.rowText}>
                <AppText style={styles.rowTitle}>{item.title}</AppText>
                <AppText style={styles.rowBody}>{item.body}</AppText>
              </View>
            </View>
          </View>
        ))}
      </View>

      {optionalNote ? (
        <View style={styles.optionalNote}>
          <AppText style={styles.optionalText}>{optionalNote}</AppText>
        </View>
      ) : null}
    </BottomSheetModal>
  );
}
