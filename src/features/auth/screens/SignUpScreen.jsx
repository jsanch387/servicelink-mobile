import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, SocialSignInButton, SurfaceTextField } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { useAuth } from '..';
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
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
                <AppText style={[styles.title, styles.titleType]}>Create account</AppText>
                <AppText style={[styles.subtitle, styles.subtitleType]}>
                  Create your account to manage your business profile.
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
                  autoComplete="password-new"
                  label="Password"
                  onChangeText={(v) => {
                    setPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Create a password"
                  showPasswordToggle
                  textContentType="newPassword"
                  value={password}
                />
                <SurfaceTextField
                  autoComplete="password-new"
                  label="Confirm password"
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Confirm your password"
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

            <View style={styles.footer}>
              <AppText style={styles.footerPrompt}>Already have an account? </AppText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={goToLogin}>
                <AppText style={styles.footerLinkStrong}>Sign in</AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
