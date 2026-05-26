import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { openWebPageInAppBrowser } from '../../../lib/openWebPageInAppBrowser';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { getWebForgotPasswordUrl } from '../../../lib/webAppOrigin';
import { useTheme, FONT_FAMILIES } from '../../../theme';

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const url = useMemo(() => getWebForgotPasswordUrl(), []);
  const openedOnce = useRef(false);

  const openForgotPage = useCallback(async () => {
    await openWebPageInAppBrowser(url);
  }, [url]);

  useEffect(() => {
    if (openedOnce.current) {
      return;
    }
    openedOnce.current = true;
    void openForgotPage();
  }, [openForgotPage]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        header: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 8,
          minHeight: 48,
          paddingHorizontal: 8,
          paddingVertical: 8,
        },
        backHit: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        headerTitle: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
        },
        body: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        lead: {
          color: colors.textMuted,
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 24,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={styles.backHit}
          >
            <Ionicons color={colors.text} name="chevron-back" size={28} />
          </Pressable>
          <AppText numberOfLines={1} style={styles.headerTitle}>
            Reset password
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.body}>
          <AppText style={styles.lead}>
            Use the secure browser sheet to reset your password, then return here and sign in.
          </AppText>
          <Button
            accessibilityLabel="Open reset password"
            fullWidth
            onPress={() => void openForgotPage()}
            title="Open reset password"
          />
          <View style={{ height: 12 }} />
          <Button
            accessibilityLabel="Back to sign in"
            fullWidth
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            title="Back to sign in"
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
