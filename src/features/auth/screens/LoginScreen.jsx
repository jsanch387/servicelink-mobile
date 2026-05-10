import { useNavigation } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppShellGlow,
  AppText,
  Button,
  SocialSignInButton,
  SurfaceTextField,
} from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { useAuth } from '..';
import { AuthBrandLogo } from '../components/AuthBrandLogo';
import { getAuthFormSharedStyles } from '../authFormStyles';

export function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const passwordFieldRef = useRef(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        centerBlock: {
          alignSelf: 'center',
          maxWidth: 400,
          width: '100%',
        },
        passwordField: {
          marginBottom: 0,
        },
        forgotLink: {
          alignSelf: 'flex-end',
          marginBottom: 16,
          marginTop: 4,
          paddingVertical: 2,
        },
        forgotLinkText: {
          color: colors.linkSubtle,
          fontSize: 14,
          fontWeight: '600',
        },
        formError: {
          color: colors.danger,
          fontSize: 14,
          marginBottom: 12,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const handleLogin = async () => {
    Keyboard.dismiss();
    setFormError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(trimmedEmail, password);
    setSubmitting(false);
    if (error) {
      setFormError(error);
    }
  };

  const goToSignUp = () => {
    navigation.navigate(ROUTES.SIGN_UP);
  };

  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    setFormError('');
    setGoogleSubmitting(true);
    const { error, cancelled } = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (cancelled) {
      return;
    }
    if (error) {
      setFormError(error);
    }
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
                      blurOnSubmit={false}
                      keyboardType="email-address"
                      label="Email"
                      onChangeText={(v) => {
                        setEmail(v);
                        if (formError) {
                          setFormError('');
                        }
                      }}
                      onSubmitEditing={() => passwordFieldRef.current?.focus()}
                      placeholder="you@company.com"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      value={email}
                    />
                    <SurfaceTextField
                      ref={passwordFieldRef}
                      autoComplete="password"
                      blurOnSubmit
                      containerStyle={styles.passwordField}
                      label="Password"
                      onChangeText={(v) => {
                        setPassword(v);
                        if (formError) {
                          setFormError('');
                        }
                      }}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder="Enter your password"
                      returnKeyType="done"
                      showPasswordToggle
                      textContentType="password"
                      value={password}
                    />
                    {formError ? <AppText style={styles.formError}>{formError}</AppText> : null}
                    <Pressable
                      accessibilityLabel="Forgot password"
                      accessibilityRole="button"
                      hitSlop={12}
                      onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
                      style={styles.forgotLink}
                    >
                      <AppText style={styles.forgotLinkText}>Forgot password?</AppText>
                    </Pressable>
                    <Button
                      accessibilityLabel="Log in"
                      fullWidth
                      loading={submitting}
                      onPress={handleLogin}
                      title="Login"
                    />

                    <View style={styles.divider}>
                      <View style={[styles.dividerLine, styles.dividerLineFill]} />
                      <AppText style={styles.dividerText}>or</AppText>
                      <View style={[styles.dividerLine, styles.dividerLineFill]} />
                    </View>

                    <SocialSignInButton
                      disabled={submitting || googleSubmitting}
                      fullWidth
                      onPress={handleGoogleSignIn}
                      provider="google"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <AppText style={styles.footerMuted}>New to ServiceLink? </AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={goToSignUp}>
                  <AppText style={styles.footerLinkStrong}>Create an account</AppText>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
