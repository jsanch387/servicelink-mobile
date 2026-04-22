import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        safe: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        keyboard: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        scroll: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        titleType: {
          fontSize: 30,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 36,
        },
        subtitleType: {
          fontSize: 16,
          fontWeight: '400',
          lineHeight: 24,
          marginTop: 10,
        },
        centerBlock: {
          alignSelf: 'center',
          marginTop: 100,
          maxWidth: 400,
          width: '100%',
        },
        passwordField: {
          marginBottom: 6,
        },
        forgotLink: {
          alignSelf: 'flex-end',
          marginBottom: 16,
          marginTop: 0,
          paddingVertical: 2,
        },
        forgotLinkText: {
          color: colors.linkSubtle,
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
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.centerBlock}>
              <View style={styles.header}>
                <AppText style={[styles.title, styles.titleType]}>Welcome back</AppText>
                <AppText style={[styles.subtitle, styles.subtitleType]}>
                  Login to manage your business profile.
                </AppText>
              </View>

              <View style={styles.form}>
                <SurfaceTextField
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(v) => {
                    setEmail(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="you@company.com"
                  textContentType="emailAddress"
                  value={email}
                />
                <SurfaceTextField
                  autoComplete="password"
                  containerStyle={styles.passwordField}
                  label="Password"
                  onChangeText={(v) => {
                    setPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Enter your password"
                  showPasswordToggle
                  textContentType="password"
                  value={password}
                />
                {formError ? <AppText style={styles.formError}>{formError}</AppText> : null}
                <Pressable accessibilityRole="button" hitSlop={12} style={styles.forgotLink}>
                  <AppText className="text-sm font-semibold" style={styles.forgotLinkText}>
                    Forgot password?
                  </AppText>
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

            <View style={styles.footer}>
              <AppText className="text-sm" style={styles.footerMuted}>
                New to ServiceLink?{' '}
              </AppText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={goToSignUp}>
                <AppText className="text-sm font-semibold" style={styles.link}>
                  Create an account
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
