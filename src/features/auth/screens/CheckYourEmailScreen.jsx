import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppShellGlow, AppText, Button } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme, FONT_FAMILIES } from '../../../theme';
import { useAuth } from '..';
import { AuthBrandLogo } from '../components/AuthBrandLogo';
import { getAuthFormSharedStyles } from '../authFormStyles';

export function CheckYourEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { resendSignupConfirmation } = useAuth();
  const email = typeof route.params?.email === 'string' ? route.params.email.trim() : '';
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendOk, setResendOk] = useState(false);

  useEffect(() => {
    if (!email) {
      navigation.replace(ROUTES.LOGIN);
    }
  }, [email, navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        root: {
          flex: 1,
        },
        topBar: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexDirection: 'row',
          minHeight: 44,
          paddingHorizontal: 8,
        },
        body: {
          flex: 1,
          justifyContent: 'center',
          paddingBottom: 32,
          paddingHorizontal: 16,
          paddingTop: 8,
        },
        backHit: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        header: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginBottom: 22,
        },
        title: {
          alignSelf: 'stretch',
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 26,
          letterSpacing: -0.55,
          lineHeight: 30,
          marginTop: 12,
          textAlign: 'center',
        },
        lede: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 8,
          paddingHorizontal: 8,
          textAlign: 'center',
        },
        card: {
          alignSelf: 'stretch',
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 20,
          paddingVertical: 22,
          width: '100%',
          ...Platform.select({
            ios: {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            },
            default: {},
          }),
        },
        mailBadge: {
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: colors.shell,
          borderColor: colors.cardBorder,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          height: 52,
          justifyContent: 'center',
          marginBottom: 16,
          width: 52,
        },
        email: {
          alignSelf: 'stretch',
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
          lineHeight: 22,
          textAlign: 'center',
        },
        hint: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 10,
          textAlign: 'center',
        },
        feedback: {
          alignSelf: 'stretch',
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
          marginTop: 4,
          textAlign: 'center',
        },
        feedbackError: {
          color: colors.danger,
        },
        feedbackOk: {
          color: colors.accent,
        },
        actions: {
          gap: 10,
          marginTop: 18,
        },
      }),
    [colors],
  );

  const goBackToSignUp = () => {
    navigation.navigate(ROUTES.SIGN_UP);
  };

  const goToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  const handleResend = async () => {
    setResendError('');
    setResendOk(false);
    setResending(true);
    const { error } = await resendSignupConfirmation(email);
    setResending(false);
    if (error) {
      setResendError(error);
      return;
    }
    setResendOk(true);
  };

  if (!email) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <AppShellGlow />
      <SafeAreaView style={styles.shellGlowSafe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.shellGlowKeyboard}
        >
          <View style={styles.shellGlowScroll}>
            <View style={styles.root}>
              <View style={styles.topBar}>
                <Pressable
                  accessibilityLabel="Back to sign up"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={goBackToSignUp}
                  style={styles.backHit}
                >
                  <Ionicons color={colors.text} name="chevron-back" size={26} />
                </Pressable>
              </View>
              <View style={styles.body}>
                <View style={styles.centerBlock}>
                  <View style={styles.header}>
                    <AuthBrandLogo />
                    <AppText style={styles.title}>Almost there</AppText>
                    <AppText style={styles.lede}>
                      Open the link in your email, then sign in.
                    </AppText>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.mailBadge}>
                      <Ionicons color={colors.textMuted} name="mail-outline" size={24} />
                    </View>
                    <AppText style={styles.email}>{email}</AppText>
                    <AppText style={styles.hint}>Check spam or junk if you do not see it.</AppText>
                    {resendError ? (
                      <AppText style={[styles.feedback, styles.feedbackError]}>
                        {resendError}
                      </AppText>
                    ) : null}
                    {resendOk ? (
                      <AppText style={[styles.feedback, styles.feedbackOk]}>Sent again.</AppText>
                    ) : null}
                    <View style={styles.actions}>
                      <Button
                        accessibilityLabel="Resend confirmation link"
                        fullWidth
                        loading={resending}
                        onPress={handleResend}
                        title="Resend link"
                        variant="outline"
                        outlineThin
                      />
                      <Button
                        accessibilityLabel="Sign in"
                        fullWidth
                        onPress={goToLogin}
                        title="Sign in"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
