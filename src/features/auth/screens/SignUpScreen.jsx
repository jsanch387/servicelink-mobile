import { useNavigation } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
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

export function SignUpScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const passwordFieldRef = useRef(null);
  const confirmPasswordFieldRef = useRef(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        formError: {
          color: colors.danger,
          fontSize: 14,
          marginBottom: 12,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setFormError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError('Enter your email and a password.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp(trimmedEmail, password);
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    if (needsEmailConfirmation) {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. After you confirm, you can sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate(ROUTES.LOGIN) }],
      );
    }
  };

  const goToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
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
      return;
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
                  <AppText style={[styles.title, styles.authHeadingTitle]}>Create account</AppText>
                  <AppText style={[styles.subtitle, styles.authHeadingSubtitle]}>
                    Sign up to manage your business.
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
                      autoComplete="password-new"
                      blurOnSubmit={false}
                      label="Password"
                      onChangeText={(v) => {
                        setPassword(v);
                        if (formError) {
                          setFormError('');
                        }
                      }}
                      onSubmitEditing={() => confirmPasswordFieldRef.current?.focus()}
                      placeholder="Create a password"
                      returnKeyType="next"
                      showPasswordToggle
                      textContentType="newPassword"
                      value={password}
                    />
                    <SurfaceTextField
                      ref={confirmPasswordFieldRef}
                      autoComplete="password-new"
                      blurOnSubmit
                      label="Confirm password"
                      onChangeText={(v) => {
                        setConfirmPassword(v);
                        if (formError) {
                          setFormError('');
                        }
                      }}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder="Confirm your password"
                      returnKeyType="done"
                      showPasswordToggle
                      textContentType="newPassword"
                      value={confirmPassword}
                    />
                    {formError ? <AppText style={styles.formError}>{formError}</AppText> : null}
                    <Button
                      accessibilityLabel="Sign up"
                      fullWidth
                      loading={submitting}
                      onPress={handleSignUp}
                      title="Sign up"
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
                <AppText style={styles.footerPrompt}>Already have an account? </AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={goToLogin}>
                  <AppText style={styles.footerLinkStrong}>Sign in</AppText>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
