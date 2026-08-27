import { useLayoutEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import {
  MAINTENANCE_CREATION_DISABLED_MESSAGE,
  MAINTENANCE_SUNSET_NOTICE_TITLE,
} from '../../../maintenance/constants';

/** New maintenance offers are retired; this screen only explains the sunset. */
export function MaintenanceInviteScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: MAINTENANCE_SUNSET_NOTICE_TITLE });
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          marginTop: 10,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <View style={styles.content}>
        <AppText style={styles.title}>{MAINTENANCE_SUNSET_NOTICE_TITLE}</AppText>
        <AppText style={styles.body}>{MAINTENANCE_CREATION_DISABLED_MESSAGE}</AppText>
      </View>
    </SafeAreaView>
  );
}
