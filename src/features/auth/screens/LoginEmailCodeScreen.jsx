import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppShellGlow, AppText, AppTextInput, Button } from '../../../components/ui';
import { iosKeyboardDoneAccessoryInputProps } from '../../../components/ui/KeyboardDoneAccessory';
import { ROUTES } from '../../../routes/routes';
import { useTheme, FONT_FAMILIES } from '../../../theme';
import { useAuth } from '..';
import { getAuthFormSharedStyles } from '../authFormStyles';
import {
  LOGIN_CODE_DIGIT_COUNT,
  LOGIN_CODE_SCREEN_TITLE,
  LOGIN_CODE_SPAM_HINT,
} from '../constants/existingAccountOnlyCopy';

export function LoginEmailCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { sendLoginCode, verifyLoginCode } = useAuth();
  const email = typeof route.params?.email === 'string' ? route.params.email.trim() : '';

  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        topBar: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 44,
          paddingHorizontal: 8,
        },
        backHit: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        scrollContent: {
          flexGrow: 1,
        },
        authScreenMain: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 28,
          paddingHorizontal: 24,
          paddingTop: 8,
        },
        centerBlock: {
          alignSelf: 'center',
          maxWidth: 400,
          width: '100%',
        },
        header: {
          alignItems: 'center',
          alignSelf: 'stretch',
          marginBottom: 36,
        },
        codeTitle: {
          fontSize: 26,
          letterSpacing: -0.6,
          lineHeight: 32,
        },
        sentLine: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 21,
          marginTop: 6,
          textAlign: 'center',
        },
        codeWrap: {
          marginBottom: formError ? 10 : 20,
          position: 'relative',
        },
        codeRow: {
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        cell: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          flex: 1,
          height: 56,
          justifyContent: 'center',
        },
        cellActive: {
          borderColor: colors.text,
        },
        cellError: {
          borderColor: colors.danger,
        },
        digit: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.3,
        },
        codeInput: {
          ...StyleSheet.absoluteFillObject,
          color: 'transparent',
          fontSize: 16,
        },
        formError: {
          color: colors.danger,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
          textAlign: 'center',
        },
        notes: {
          alignItems: 'center',
          marginTop: 28,
        },
        resendLink: {
          color: colors.link,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.15,
          lineHeight: 20,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 18,
          marginTop: 18,
          textAlign: 'center',
        },
        feedbackOk: {
          color: colors.textSuccess,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 18,
          textAlign: 'center',
        },
      }),
    [colors, formError],
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

  const activeIndex = focused ? Math.min(code.length, LOGIN_CODE_DIGIT_COUNT - 1) : -1;

  return (
    <View style={styles.screen}>
      <AppShellGlow />
      <SafeAreaView style={styles.shellGlowSafe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.shellGlowKeyboard}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Back to login"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goBackToLogin}
            >
              <View style={styles.backHit}>
                <Ionicons color={colors.text} name="chevron-back" size={26} />
              </View>
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.shellGlowScroll}
          >
            <Pressable
              accessible={false}
              onPress={() => Keyboard.dismiss()}
              style={styles.authScreenMain}
            >
              <View style={styles.centerBlock}>
                <View style={styles.header}>
                  <AppText
                    accessibilityRole="header"
                    style={[styles.title, styles.authHeadingTitle, styles.codeTitle]}
                  >
                    {LOGIN_CODE_SCREEN_TITLE}
                  </AppText>
                  <AppText style={styles.sentLine}>We sent a code to your email.</AppText>
                </View>

                <View style={styles.codeWrap}>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    pointerEvents="none"
                    style={styles.codeRow}
                  >
                    {Array.from({ length: LOGIN_CODE_DIGIT_COUNT }, (_, index) => {
                      const filled = index < code.length;
                      const active = index === activeIndex && !formError;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.cell,
                            active && styles.cellActive,
                            formError ? styles.cellError : null,
                          ]}
                        >
                          <AppText style={styles.digit}>{filled ? code[index] : ''}</AppText>
                        </View>
                      );
                    })}
                  </View>
                  <AppTextInput
                    ref={codeFieldRef}
                    autoComplete="one-time-code"
                    autoFocus
                    caretHidden
                    keyboardType="number-pad"
                    maxLength={LOGIN_CODE_DIGIT_COUNT}
                    onBlur={() => setFocused(false)}
                    onChangeText={(v) => {
                      setCode(v.replace(/\D/g, '').slice(0, LOGIN_CODE_DIGIT_COUNT));
                      if (formError) {
                        setFormError('');
                      }
                      if (resendOk) {
                        setResendOk(false);
                      }
                    }}
                    onFocus={() => setFocused(true)}
                    selectionColor="transparent"
                    style={styles.codeInput}
                    textContentType="oneTimeCode"
                    value={code}
                    {...iosKeyboardDoneAccessoryInputProps()}
                    accessibilityLabel="Login code"
                  />
                </View>

                {formError ? (
                  <AppText accessibilityRole="alert" style={styles.formError}>
                    {formError}
                  </AppText>
                ) : null}

                <Button
                  accessibilityLabel="Verify login code"
                  fullWidth
                  loading={verifying}
                  onPress={handleVerify}
                  title="Sign in"
                />

                <View style={styles.notes}>
                  <Pressable
                    accessibilityLabel="Resend login code"
                    accessibilityRole="button"
                    disabled={resending}
                    hitSlop={8}
                    onPress={() => void handleResend()}
                  >
                    <AppText style={styles.resendLink}>
                      {resending ? 'Sending…' : 'Resend code'}
                    </AppText>
                  </Pressable>
                  <AppText style={resendOk ? styles.feedbackOk : styles.footnote}>
                    {resendOk ? 'New code sent.' : LOGIN_CODE_SPAM_HINT}
                  </AppText>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
