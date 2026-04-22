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
import { AppText, Button, SocialSignInButton, TextField } from '../../../components/ui';
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
                  Create account
                </AppText>
                <AppText className="mt-3 text-base leading-6" style={styles.subtitle}>
                  Enter your details or continue with Google or Apple.
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
                  autoComplete="password-new"
                  label="Password"
                  onChangeText={(v) => {
                    setPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Create a password"
                  secureTextEntry
                  textContentType="newPassword"
                  value={password}
                />
                <TextField
                  autoComplete="password-new"
                  label="Confirm password"
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (formError) {
                      setFormError('');
                    }
                  }}
                  placeholder="Confirm your password"
                  secureTextEntry
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
                Already have an account?{' '}
              </AppText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={goToLogin}>
                <AppText className="text-sm font-semibold" style={styles.link}>
                  Sign in
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
