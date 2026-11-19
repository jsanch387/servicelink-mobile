import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { AssistantActionList } from '../components/AssistantActionList';
import { AssistantComposer } from '../components/AssistantComposer';
import { ASSISTANT_LEAD } from '../constants/assistantCopy';

export function AssistantScreen() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        body: {
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        leadRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 20,
          width: '100%',
        },
        leadIcon: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginRight: 8,
          width: 22,
        },
        leadCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        lead: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
        spacer: {
          flex: 1,
        },
        composer: {
          paddingBottom: 12,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={styles.leadRow}>
          <View style={styles.leadIcon}>
            <Ionicons color={colors.text} name="sparkles" size={16} />
          </View>
          <View style={styles.leadCopy}>
            <AppText style={styles.lead}>{ASSISTANT_LEAD}</AppText>
          </View>
        </View>
        <AssistantActionList />
      </View>
      <View style={styles.spacer} />
      <View style={styles.composer}>
        <AssistantComposer />
      </View>
    </View>
  );
}
