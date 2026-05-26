import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppShellGlow, AppText, Button, SurfaceTextField } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme, FONT_FAMILIES } from '../../../theme';
import { useAuth } from '..';
import { AuthBrandLogo } from '../components/AuthBrandLogo';
import { getAuthFormSharedStyles } from '../authFormStyles';
import {
  formatLoginCodeScreenSubtitle,
  LOGIN_CODE_DIGIT_COUNT,
  LOGIN_CODE_SCREEN_TITLE,
  LOGIN_CODE_SPAM_HINT,
} from '../constants/existingAccountOnlyCopy';

export function LoginEmailCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sendLoginCode, verifyLoginCode } = useAuth();
  const email = typeof route.params?.email === 'string' ? route.params.email.trim() : '';

  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const codeFieldRef = useRef(null);

  useEffect(() => {
    if (!email) {
      navigation.replace(ROUTES.LOGIN);
    }
  }, [email, navigation]);

  const subtitle = useMemo(() => formatLoginCodeScreenSubtitle(email), [email]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        backOverlay: {
          left: 4,
          position: 'absolute',
          zIndex: 10,
        },
        backHit: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        centerBlock: {
          alignSelf: 'center',
          maxWidth: 400,
          width: '100%',
        },
        authHeadingSubtitle: {
          alignSelf: 'stretch',
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 21,
          marginTop: 4,
          paddingHorizontal: 0,
          textAlign: 'center',
        },
        feedbackOk: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginBottom: 8,
          marginTop: 4,
          textAlign: 'center',
        },
        spamHint: {
          alignSelf: 'center',
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 19,
          marginTop: 22,
          maxWidth: 360,
          textAlign: 'center',
        },
        resendRow: {
          alignItems: 'center',
          marginTop: 16,
        },
        resendPrompt: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        resendLink: {
          color: colors.link,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          lineHeight: 20,
        },
      }),
    [colors],
  );

  const goBackToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  const handleVerify = async () => {
    Keyboard.dismiss();
    setFormError('');
    setResendOk(false);
    const trimmedCode = code.replace(/\s/g, '');
    if (!trimmedCode) {
      setFormError(`Enter the ${LOGIN_CODE_DIGIT_COUNT}-digit code from your email.`);
      return;
    }
    if (trimmedCode.length < LOGIN_CODE_DIGIT_COUNT) {
      setFormError(`Enter all ${LOGIN_CODE_DIGIT_COUNT} digits from your email.`);
      return;
    }
    setVerifying(true);
    const { error } = await verifyLoginCode(email, trimmedCode);
    setVerifying(false);
    if (error) {
      setFormError(error);
    }
  };

  const handleResend = async () => {
    Keyboard.dismiss();
    setFormError('');
    setResendOk(false);
    setResending(true);
    const { error } = await sendLoginCode(email);
    setResending(false);
    if (error) {
      setFormError(error);
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
            <Pressable
              accessible={false}
              onPress={() => Keyboard.dismiss()}
              style={styles.authScreenMain}
            >
              <View style={styles.centerBlock}>
                <View style={styles.header}>
                  <AuthBrandLogo />
                  <AppText style={[styles.title, styles.authHeadingTitle]}>
                    {LOGIN_CODE_SCREEN_TITLE}
                  </AppText>
                  <AppText style={[styles.subtitle, styles.authHeadingSubtitle]}>
                    {subtitle}
                  </AppText>
                </View>

                <View style={styles.authFormPanel}>
                  <View style={styles.form}>
                    <SurfaceTextField
                      ref={codeFieldRef}
                      autoComplete="one-time-code"
                      errorText={formError || undefined}
                      keyboardType="number-pad"
                      label="Login code"
                      maxLength={LOGIN_CODE_DIGIT_COUNT}
                      onChangeText={(v) => {
                        setCode(v.replace(/\D/g, '').slice(0, LOGIN_CODE_DIGIT_COUNT));
                        if (formError) {
                          setFormError('');
                        }
                        if (resendOk) {
                          setResendOk(false);
                        }
                      }}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder={'0'.repeat(LOGIN_CODE_DIGIT_COUNT)}
                      returnKeyType="done"
                      textContentType="oneTimeCode"
                      value={code}
                    />

                    {resendOk ? <AppText style={styles.feedbackOk}>New code sent.</AppText> : null}

                    <Button
                      accessibilityLabel="Verify login code"
                      fullWidth
                      loading={verifying}
                      onPress={handleVerify}
                      title="Sign in"
                    />

                    <View style={styles.resendRow}>
                      <Pressable
                        accessibilityLabel="Resend login code"
                        accessibilityRole="button"
                        disabled={resending}
                        hitSlop={8}
                        onPress={() => void handleResend()}
                      >
                        <AppText style={styles.resendPrompt}>
                          Didn&apos;t get a code?{' '}
                          <AppText style={styles.resendLink}>
                            {resending ? 'Sending…' : 'Resend code'}
                          </AppText>
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <AppText style={styles.spamHint}>{LOGIN_CODE_SPAM_HINT}</AppText>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        <Pressable
          accessibilityLabel="Back to login"
          accessibilityRole="button"
          hitSlop={8}
          onPress={goBackToLogin}
          style={[styles.backOverlay, { top: insets.top + 8 }]}
        >
          <View style={styles.backHit}>
            <Ionicons color={colors.text} name="chevron-back" size={28} />
          </View>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
