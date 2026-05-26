import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
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
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { useAuth } from '..';
import { AuthBrandLogo } from '../components/AuthBrandLogo';
import { getAuthFormSharedStyles } from '../authFormStyles';
import { LOGIN_SCREEN_SUBTITLE, LOGIN_SCREEN_TITLE } from '../constants/existingAccountOnlyCopy';

export function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { sendLoginCode } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrorHint, setFormErrorHint] = useState('');

  const clearFormErrors = () => {
    setFormError('');
    setFormErrorHint('');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ...getAuthFormSharedStyles(colors),
        centerBlock: {
          alignSelf: 'center',
          maxWidth: 400,
          width: '100%',
        },
        authHeadingSubtitleWide: {
          alignSelf: 'stretch',
          maxWidth: undefined,
          paddingHorizontal: 0,
          width: '100%',
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
                  <AppText
                    accessibilityRole="header"
                    style={[styles.title, styles.authHeadingTitle]}
                  >
                    {LOGIN_SCREEN_TITLE}
                  </AppText>
                  <AppText
                    style={[
                      styles.subtitle,
                      styles.authHeadingSubtitle,
                      styles.authHeadingSubtitleWide,
                    ]}
                  >
                    {LOGIN_SCREEN_SUBTITLE}
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
                      onSubmitEditing={() => void handleSendCode()}
                      placeholder="you@company.com"
                      returnKeyType="send"
                      textContentType="username"
                      value={email}
                    />
                    <Button
                      accessibilityLabel="Send login code"
                      fullWidth
                      loading={submitting}
                      onPress={handleSendCode}
                      title="Send login code"
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
