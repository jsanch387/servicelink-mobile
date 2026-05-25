import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InlineCardError,
  SelectField,
  SubmitOutcomeError,
  SubmitOutcomePending,
  SubmitOutcomeSuccess,
  SurfaceCard,
  SurfaceTextField,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useAuth } from '../../auth';
import { useTheme } from '../../../theme';
import { postContactForm } from '../api/postContactForm';
import { CONTACT_TOPICS, DEFAULT_CONTACT_TOPIC } from '../constants/contactTopics';
import { SUPPORT_SUBMIT_MIN_PENDING_MS } from '../constants/supportSubmitTiming';
import { resolveContactFormSubmitter } from '../utils/resolveContactFormSubmitter';
import { CONTACT_MESSAGE_MAX, validateContactForm } from '../utils/validateContactForm';

/** @typedef {'form' | 'pending' | 'success' | 'error'} SupportScreenPhase */

export function SupportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [topic, setTopic] = useState(DEFAULT_CONTACT_TOPIC);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState(/** @type {SupportScreenPhase} */ ('form'));

  const accountEmail = useMemo(
    () => (typeof user?.email === 'string' ? user.email.trim() : ''),
    [user?.email],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        card: {
          gap: 4,
        },
        intro: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 8,
        },
        introEmail: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
        },
        messageInput: {
          minHeight: 120,
          paddingTop: Platform.OS === 'ios' ? 10 : 8,
        },
        actions: {
          gap: 10,
          marginTop: 8,
        },
        errorStack: {
          gap: 8,
        },
        statusSlot: {
          flexGrow: 1,
        },
      }),
    [colors],
  );

  const returnToForm = useCallback(() => {
    setSubmitError('');
    setPhase('form');
  }, []);

  const resetForm = useCallback(() => {
    setTopic(DEFAULT_CONTACT_TOPIC);
    setMessage('');
    setFieldError('');
    setSubmitError('');
    setPhase('form');
  }, []);

  const handleSubmit = useCallback(async () => {
    setFieldError('');
    setSubmitError('');

    const validation = validateContactForm({ topic, message });
    if (!validation.ok) {
      setFieldError(validation.error);
      return;
    }

    const submitter = resolveContactFormSubmitter(user);
    if (!submitter.ok) {
      setSubmitError(submitter.error);
      return;
    }

    setPhase('pending');

    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, SUPPORT_SUBMIT_MIN_PENDING_MS);
    });

    const [result] = await Promise.all([
      postContactForm({
        name: submitter.name,
        email: submitter.email,
        topic,
        message: message.trim(),
      }),
      pendingMin,
    ]);

    if (result.ok) {
      setPhase('success');
      return;
    }

    if (result.code === 'RATE_LIMITED' && result.retryAfterSeconds) {
      const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
      setSubmitError(
        `${result.error} Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      );
    } else {
      setSubmitError(result.error);
    }

    setPhase('error');
  }, [message, topic, user]);

  const renderStatus = () => {
    if (phase === 'pending') {
      return <SubmitOutcomePending accessibilityLabel="Sending message" card title="Sending" />;
    }
    if (phase === 'success') {
      return (
        <SubmitOutcomeSuccess
          body="Thanks for reaching out. We usually respond within 24 hours."
          iconAccessibilityLabel="Message sent"
          primaryAction={{ title: 'Done', onPress: resetForm }}
          title="Message sent"
        />
      );
    }
    if (phase === 'error') {
      return (
        <SubmitOutcomeError
          iconAccessibilityLabel="Message could not be sent"
          message={submitError}
          onPrimaryAction={returnToForm}
        />
      );
    }
    return null;
  };

  if (phase === 'pending' || phase === 'success' || phase === 'error') {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.statusSlot}>{renderStatus()}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <SurfaceCard style={styles.card}>
            <AppText style={styles.intro}>
              Send us a feature request, report a bug, or ask a question.
              {accountEmail ? (
                <>
                  {' We will reply to '}
                  <AppText style={styles.introEmail}>{accountEmail}</AppText>
                </>
              ) : (
                <>
                  {' We will reply to '}
                  <AppText style={styles.introEmail}>your account email</AppText>
                </>
              )}
            </AppText>

            {fieldError ? (
              <View style={styles.errorStack}>
                <InlineCardError message={fieldError} />
              </View>
            ) : null}

            <SelectField
              fieldStyle={{ marginTop: 0 }}
              label="Topic"
              onValueChange={setTopic}
              options={CONTACT_TOPICS}
              placeholder="Choose a topic"
              presentation="wheel"
              title="Topic"
              value={topic}
            />
            <SurfaceTextField
              compact
              label="Message"
              maxLength={CONTACT_MESSAGE_MAX}
              multiline
              onChangeText={setMessage}
              placeholder="Describe your request (at least 10 characters)"
              style={styles.messageInput}
              textAlignVertical="top"
              value={message}
            />

            <View style={styles.actions}>
              <Button
                fullWidth
                title="Send message"
                onPress={() => {
                  void handleSubmit();
                }}
              />
            </View>
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
