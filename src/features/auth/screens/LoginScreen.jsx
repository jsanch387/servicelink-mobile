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
import { AppText, Button, SocialSignInButton, TextField } from '../../../components/ui';
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
        passwordFieldTight: {
          marginBottom: 6,
        },
        forgotLink: {
          alignSelf: 'flex-end',
          marginBottom: 24,
          marginTop: 2,
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
                <AppText className="text-3xl font-bold leading-tight" style={styles.title}>
                  Welcome back
                </AppText>
                <AppText className="mt-3 text-base leading-6" style={styles.subtitle}>
                  Sign in to keep jobs, clients, and your team in sync.
                </AppText>
              </View>

              <View style={styles.form}>
                <TextField
                  autoComplete="email"
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
                <TextField
                  autoComplete="password"
                  containerStyle={styles.passwordFieldTight}
                  label="Password"
                  onChangeText={(v) => {
                    setPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
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

                <View style={styles.socialRow}>
                  <View style={styles.socialHalf}>
                    <SocialSignInButton
                      compact
                      disabled={submitting || googleSubmitting}
                      fullWidth
                      onPress={handleGoogleSignIn}
                      provider="google"
                    />
                  </View>
                  <View style={styles.socialHalf}>
                    <SocialSignInButton
                      compact
                      disabled={submitting || googleSubmitting}
                      fullWidth
                      provider="apple"
                    />
                  </View>
                </View>
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
