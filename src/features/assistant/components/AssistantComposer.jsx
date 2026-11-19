import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { ASSISTANT_COMPOSER_PLACEHOLDER } from '../constants/assistantCopy';

const FIELD_HEIGHT = 48;
const SEND_SIZE = 44;

/**
 * Visual stand-in for the future ask field. It does not focus or send.
 */
export function AssistantComposer() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        field: {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          borderRadius: FIELD_HEIGHT / 2,
          borderWidth: StyleSheet.hairlineWidth,
          flex: 1,
          height: FIELD_HEIGHT,
          justifyContent: 'center',
          marginRight: 8,
          minWidth: 0,
          paddingHorizontal: 18,
        },
        placeholder: {
          color: colors.placeholder,
          fontSize: 16,
          fontWeight: '400',
        },
        send: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: SEND_SIZE / 2,
          height: SEND_SIZE,
          justifyContent: 'center',
          width: SEND_SIZE,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <AppText numberOfLines={1} style={styles.placeholder}>
          {ASSISTANT_COMPOSER_PLACEHOLDER}
        </AppText>
      </View>
      <View style={styles.send}>
        <Ionicons color={colors.buttonPrimaryText} name="arrow-up" size={18} />
      </View>
    </View>
  );
}
