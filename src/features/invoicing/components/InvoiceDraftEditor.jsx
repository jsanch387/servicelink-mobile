import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText, Button } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { CREATE_INVOICE_STEPS } from '../constants/createInvoiceWizard';
import { CreateInvoiceForm } from './create-invoice/CreateInvoiceForm';

const LAST_STEP = CREATE_INVOICE_STEPS.length - 1;
const STEP_RING_SIZE = 16;
const STEP_RING_STROKE = 2;

/**
 * Existing draft, using the same steps as a new invoice. This pass does not save.
 *
 * @param {object} props
 * @param {import('../utils/createInvoiceDraft').InvoiceDraft} props.draft
 * @param {() => void} props.onClose
 * @param {(draft: import('../utils/createInvoiceDraft').InvoiceDraft) => void} [props.onReview]
 */
export function InvoiceDraftEditor({ draft: initialDraft, onClose, onReview }) {
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const step = CREATE_INVOICE_STEPS[stepIndex];
  const stepProgress = (stepIndex + 1) / CREATE_INVOICE_STEPS.length;
  const ringRadius = (STEP_RING_SIZE - STEP_RING_STROKE) / 2;
  const ringCenter = STEP_RING_SIZE / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const patchDraft = useCallback((patch) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      onClose();
      return;
    }
    setStepIndex((current) => current - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [onClose, stepIndex]);

  const goForward = useCallback(() => {
    if (stepIndex === LAST_STEP) return;
    setStepIndex((current) => current + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);

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
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 12,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingBottom: 32,
          paddingTop: 8,
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 34,
        },
        stepRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginLeft: 12,
        },
        stepCount: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: 0.2,
        },
        footer: {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        footerBtn: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.header}>
            <View style={styles.titleCol}>
              <AppText style={styles.title}>{step.title}</AppText>
            </View>
            <View
              accessibilityLabel={`Step ${stepIndex + 1} of ${CREATE_INVOICE_STEPS.length}`}
              style={styles.stepRow}
            >
              <Svg height={STEP_RING_SIZE} width={STEP_RING_SIZE}>
                <Circle
                  cx={ringCenter}
                  cy={ringCenter}
                  fill="none"
                  r={ringRadius}
                  stroke={colors.border}
                  strokeWidth={STEP_RING_STROKE}
                />
                <Circle
                  cx={ringCenter}
                  cy={ringCenter}
                  fill="none"
                  r={ringRadius}
                  stroke={colors.text}
                  strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                  strokeDashoffset={ringCircumference * (1 - stepProgress)}
                  strokeLinecap="round"
                  strokeWidth={STEP_RING_STROKE}
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                />
              </Svg>
              <AppText style={styles.stepCount}>
                {stepIndex + 1} of {CREATE_INVOICE_STEPS.length}
              </AppText>
            </View>
          </View>
          <CreateInvoiceForm draft={draft} step={step.id} onChange={patchDraft} />
        </ScrollView>
        <View style={styles.footer}>
          <View style={styles.footerBtn}>
            <Button
              fullWidth
              title={stepIndex === 0 ? 'Cancel' : 'Back'}
              variant="secondary"
              onPress={goBack}
            />
          </View>
          {stepIndex < LAST_STEP ? (
            <View style={styles.footerBtn}>
              <Button fullWidth title="Continue" variant="primary" onPress={goForward} />
            </View>
          ) : onReview ? (
            <View style={styles.footerBtn}>
              <Button fullWidth title="Review" variant="primary" onPress={() => onReview(draft)} />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
