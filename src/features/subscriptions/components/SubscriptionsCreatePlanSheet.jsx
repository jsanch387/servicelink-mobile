import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AppTextInput,
  BottomSheetModal,
  Button,
  DurationSelectField,
  SurfaceTextField,
  WizardStepHeader,
} from '../../../components/ui';
import {
  minutesToServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
} from '../../../components/ui/durationTime';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { cadenceKeyFromParts } from '../constants/planCadence';
import { planSchedulesToEditorValue } from '../utils/planScheduleDraft';
import { PlanScheduleField } from './PlanScheduleField';

/** @typedef {{ cadenceKey: string; count: number; interval: 'week' | 'month'; priceCents: number }} OfferedSchedule */

const STEP_NAME = 0;
const STEP_SCHEDULE = 1;
const STEP_DESCRIPTION = 2;
const STEP_COUNT = 3;
const DESCRIPTION_MAX_LENGTH = 1000;
const DEFAULT_DURATION_HHMM = '01:00';

const CREATE_STEPS = [
  {
    title: 'Name your subscription',
    subtitle: 'What are you offering, and how long is each visit?',
  },
  {
    title: 'How often?',
    subtitle: 'Choose a schedule, set the price, then tap Add.',
  },
  {
    title: 'Description',
    subtitle: 'Tell customers what’s included each visit.',
  },
];

const EDIT_STEPS = [
  {
    title: 'Subscription details',
    subtitle: 'Update the name and visit length.',
  },
  {
    title: 'Pricing',
    subtitle: 'Update the schedules customers can pick.',
  },
  {
    title: 'Description',
    subtitle: 'What’s included each visit.',
  },
];

function scheduleToOffer(schedule) {
  const price = Number.parseFloat(String(schedule?.priceText ?? '').trim());
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    cadenceKey: cadenceKeyFromParts(schedule.count, schedule.interval),
    count: schedule.count,
    interval: schedule.interval,
    priceCents: Math.round(price * 100),
  };
}

function insertBulletPoint(text, maxLength) {
  const current = String(text ?? '');
  if (current.length >= maxLength) return current;
  if (current.trim().length === 0) return '• ';
  const needsLineBreak = !current.endsWith('\n');
  return `${current}${needsLineBreak ? '\n' : ''}• `.slice(0, maxLength);
}

function durationHHmmFromMinutes(raw) {
  const mins = Math.max(0, Math.round(Number(raw)) || 0);
  if (mins <= 0) return DEFAULT_DURATION_HHMM;
  return minutesToServiceDurationHHmm(mins) || DEFAULT_DURATION_HHMM;
}

/**
 * Create or edit a membership plan — same stepped sheet UX.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {(plan: {
 *   name: string;
 *   description: string;
 *   visitDurationMinutes: number;
 *   offeredSchedules: OfferedSchedule[];
 *   serviceName: string;
 * }) => void | Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {'create' | 'edit'} [props.mode]
 * @param {{
 *   id?: string;
 *   name?: string;
 *   description?: string;
 *   visitDurationMinutes?: number;
 *   offeredSchedules?: unknown;
 * } | null} [props.initialPlan]
 */
export function SubscriptionsCreatePlanSheet({
  visible,
  onRequestClose,
  onSubmit,
  submitting = false,
  mode = 'create',
  initialPlan = null,
}) {
  const { colors } = useTheme();
  const isEdit = mode === 'edit';
  const steps = isEdit ? EDIT_STEPS : CREATE_STEPS;

  const [step, setStep] = useState(STEP_NAME);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationHHmm, setDurationHHmm] = useState(DEFAULT_DURATION_HHMM);
  const [schedules, setSchedules] = useState([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 8,
          paddingBottom: 4,
        },
        fieldReset: {
          marginBottom: 0,
        },
        nameStep: {
          gap: 14,
        },
        descriptionCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          minHeight: 160,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        descriptionInput: {
          color: colors.inputText ?? colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
          minHeight: 136,
          padding: 0,
          textAlignVertical: 'top',
          width: '100%',
        },
        descriptionToolbar: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
          paddingHorizontal: 2,
        },
        bulletButton: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        charCount: {
          fontSize: 12,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
        },
        actionBtn: {
          flex: 1,
        },
      }),
    [colors],
  );

  const seedKey = visible ? `${mode}:${initialPlan?.id ?? 'new'}` : '';

  useEffect(() => {
    if (!seedKey) return;
    setStep(STEP_NAME);
    if (isEdit && initialPlan) {
      setName(String(initialPlan.name ?? ''));
      setDescription(String(initialPlan.description ?? ''));
      setDurationHHmm(durationHHmmFromMinutes(initialPlan.visitDurationMinutes));
      setSchedules(planSchedulesToEditorValue(initialPlan.offeredSchedules));
      return;
    }
    setName('');
    setDescription('');
    setDurationHHmm(DEFAULT_DURATION_HHMM);
    setSchedules([]);
  }, [seedKey, isEdit, initialPlan]);

  const offeredSchedules = useMemo(
    () => schedules.map(scheduleToOffer).filter(Boolean),
    [schedules],
  );

  const visitDurationMinutes = serviceDurationHHmmToMinutes(durationHHmm);
  const nameOk = String(name).trim().length > 0;
  const durationOk = visitDurationMinutes > 0;
  const descriptionOk = String(description).trim().length > 0;
  const schedulesOk =
    offeredSchedules.length === schedules.length && schedules.length > 0 && !submitting;

  const canAdvance =
    step === STEP_NAME
      ? nameOk && durationOk
      : step === STEP_SCHEDULE
        ? schedulesOk
        : descriptionOk && !submitting;

  const stepMeta = steps[step] ?? steps[0];
  const isLast = step === STEP_DESCRIPTION;
  const leftTitle = step === STEP_NAME ? 'Cancel' : 'Back';
  const rightTitle = isLast ? (isEdit ? 'Save' : 'Create') : 'Continue';
  const showDescriptionCharCount = description.length >= DESCRIPTION_MAX_LENGTH;

  const handleLeft = () => {
    if (step === STEP_NAME) {
      onRequestClose();
      return;
    }
    setStep((prev) => Math.max(STEP_NAME, prev - 1));
  };

  const handleRight = () => {
    if (!canAdvance) return;
    if (!isLast) {
      setStep((prev) => Math.min(STEP_DESCRIPTION, prev + 1));
      return;
    }
    void Promise.resolve(
      onSubmit({
        name: String(name).trim(),
        description: String(description).trim(),
        visitDurationMinutes,
        offeredSchedules,
        serviceName: '',
      }),
    );
  };

  return (
    <BottomSheetModal
      allowBackdropClose={false}
      footer={
        <View style={styles.actions}>
          <Button
            disabled={submitting}
            fullWidth
            style={styles.actionBtn}
            title={leftTitle}
            variant="secondary"
            onPress={handleLeft}
          />
          <Button
            disabled={!canAdvance}
            fullWidth
            loading={isLast && submitting}
            style={styles.actionBtn}
            title={rightTitle}
            variant="surfaceLight"
            onPress={handleRight}
          />
        </View>
      }
      liftFooterWithKeyboard={false}
      sheetHeightPercent={92}
      showHeaderDivider={false}
      stickyFooter
      title={isEdit ? 'Edit subscription' : 'New subscription'}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.stack}>
        <WizardStepHeader
          embedded
          progressAccessibilityLabel={
            isEdit ? 'Edit subscription progress' : 'Create subscription progress'
          }
          stepCount={STEP_COUNT}
          stepIndex={step}
          subtitle={stepMeta.subtitle}
          title={stepMeta.title}
        />

        {step === STEP_NAME ? (
          <View style={styles.nameStep}>
            <SurfaceTextField
              autoCapitalize="words"
              autoFocus
              compact
              containerStyle={styles.fieldReset}
              label="Name"
              placeholder="Exterior Wash"
              value={name}
              onChangeText={setName}
            />
            <DurationSelectField
              compact
              containerStyle={styles.fieldReset}
              label="Duration"
              value={durationHHmm}
              onValueChange={setDurationHHmm}
            />
          </View>
        ) : null}

        {step === STEP_SCHEDULE ? (
          <PlanScheduleField listFirst={isEdit} value={schedules} onChange={setSchedules} />
        ) : null}

        {step === STEP_DESCRIPTION ? (
          <View>
            <View style={styles.descriptionCard}>
              <AppTextInput
                autoFocus
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                placeholder="What’s included"
                placeholderTextColor={colors.placeholder}
                style={styles.descriptionInput}
                value={description}
                onChangeText={(text) =>
                  setDescription(String(text ?? '').slice(0, DESCRIPTION_MAX_LENGTH))
                }
              />
            </View>
            <View style={styles.descriptionToolbar}>
              <Pressable
                accessibilityLabel="Insert bullet point"
                accessibilityRole="button"
                hitSlop={8}
                style={styles.bulletButton}
                onPress={() =>
                  setDescription((current) => insertBulletPoint(current, DESCRIPTION_MAX_LENGTH))
                }
              >
                <Ionicons color={colors.textMuted} name="list-outline" size={18} />
              </Pressable>
              {showDescriptionCharCount ? (
                <AppText style={[styles.charCount, { color: colors.textMuted }]}>
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </AppText>
              ) : (
                <View />
              )}
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
