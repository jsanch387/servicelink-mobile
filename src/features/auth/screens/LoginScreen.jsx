import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button, SurfaceTextField } from '../../../components/ui';
import { getWebSignUpUrl } from '../../../lib/webAppOrigin';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { useAuth } from '..';
import { AuthBrandLogo } from '../components/AuthBrandLogo';
import { getAuthFormSharedStyles } from '../authFormStyles';

export function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { sendLoginCode } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrorHint, setFormErrorHint] = useState('');
  const signUpUrl = useMemo(() => getWebSignUpUrl(), []);

  const clearFormErrors = () => {
    setFormError('');
    setFormErrorHint('');
  };

  const openSignUp = useCallback(async () => {
    const supported = await Linking.canOpenURL(signUpUrl);
    if (supported) {
      await Linking.openURL(signUpUrl);
    }
  }, [signUpUrl]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        centerBlock: {
          alignSelf: 'center',
          maxWidth: 400,
          width: '100%',
        },
        signUpFooter: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 22,
        },
      }),
    [colors],
  );

  const handleSendCode = async () => {
    Keyboard.dismiss();
    clearFormErrors();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Enter your email.');
      return;
    }
    setSubmitting(true);
    const { error, errorHint } = await sendLoginCode(trimmedEmail);
    setSubmitting(false);
    if (error) {
      setFormError(error);
      setFormErrorHint(errorHint ?? '');
      return;
    }
    navigation.navigate(ROUTES.LOGIN_EMAIL_CODE, { email: trimmedEmail });
  };

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
                  <AppText style={[styles.title, styles.authHeadingTitle]}>Welcome back</AppText>
                  <AppText style={[styles.subtitle, styles.authHeadingSubtitle]}>
                    Log in to manage your business.
                  </AppText>
                </View>

                <View style={styles.authFormPanel}>
                  <View style={styles.form}>
                    <SurfaceTextField
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      blurOnSubmit
                      errorHint={formErrorHint || undefined}
                      errorText={formError || undefined}
                      keyboardType="email-address"
                      label="Email"
                      onChangeText={(v) => {
                        setEmail(v);
                        if (formError) {
                          clearFormErrors();
                        }
                      }}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder="you@company.com"
                      returnKeyType="done"
                      textContentType="emailAddress"
                      value={email}
                    />
                    <Button
                      accessibilityLabel="Send login code"
                      fullWidth
                      loading={submitting}
                      onPress={handleSendCode}
                      title="Send code"
                    />
                  </View>
                </View>

                <View style={styles.signUpFooter}>
                  <AppText style={styles.footerPrompt}>Don&apos;t have an account? </AppText>
                  <Pressable
                    accessibilityLabel="Sign up on the web"
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => void openSignUp()}
                  >
                    <AppText style={styles.footerLinkStrong}>Sign up</AppText>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
