import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  SurfaceTextField,
  WizardStepHeader,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { cadenceKeyFromParts } from '../constants/planCadence';
import { PlanScheduleField } from './PlanScheduleField';

/** @typedef {{ cadenceKey: string; count: number; interval: 'week' | 'month'; priceCents: number }} OfferedSchedule */

const STEP_NAME = 0;
const STEP_SCHEDULE = 1;
const STEP_DESCRIPTION = 2;
const STEP_COUNT = 3;
const DESCRIPTION_MAX_LENGTH = 1000;

const STEPS = [
  {
    title: 'Name your plan',
    subtitle: 'What are you offering customers?',
  },
  {
    title: 'How often?',
    subtitle: 'Choose a schedule, set the price, then tap Add.',
  },
  {
    title: 'Almost done',
    subtitle: 'Optional — what’s included with this plan.',
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

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {(plan: {
 *   name: string;
 *   description: string;
 *   offeredSchedules: OfferedSchedule[];
 *   serviceName: string;
 * }) => void | Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 */
export function SubscriptionsCreatePlanSheet({
  visible,
  onRequestClose,
  onSubmit,
  submitting = false,
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(STEP_NAME);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    if (!visible) return;
    setStep(STEP_NAME);
    setName('');
    setDescription('');
    setSchedules([]);
  }, [visible]);

  const offeredSchedules = useMemo(
    () => schedules.map(scheduleToOffer).filter(Boolean),
    [schedules],
  );

  const nameOk = String(name).trim().length > 0;
  const schedulesOk =
    offeredSchedules.length === schedules.length && schedules.length > 0 && !submitting;

  const canAdvance =
    step === STEP_NAME ? nameOk : step === STEP_SCHEDULE ? schedulesOk : !submitting;

  const stepMeta = STEPS[step] ?? STEPS[0];
  const isLast = step === STEP_DESCRIPTION;
  const leftTitle = step === STEP_NAME ? 'Cancel' : 'Back';
  const rightTitle = isLast ? 'Create plan' : 'Continue';
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
    void onSubmit({
      name: String(name).trim(),
      description: String(description).trim(),
      offeredSchedules,
      serviceName: '',
    });
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
      title="New plan"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.stack}>
        <WizardStepHeader
          embedded
          stepCount={STEP_COUNT}
          stepIndex={step}
          subtitle={stepMeta.subtitle}
          title={stepMeta.title}
          progressAccessibilityLabel="Create plan progress"
        />

        {step === STEP_NAME ? (
          <SurfaceTextField
            autoCapitalize="words"
            autoFocus
            compact
            containerStyle={styles.fieldReset}
            label="Plan name"
            placeholder="Exterior Wash"
            value={name}
            onChangeText={setName}
          />
        ) : null}

        {step === STEP_SCHEDULE ? (
          <PlanScheduleField value={schedules} onChange={setSchedules} />
        ) : null}

        {step === STEP_DESCRIPTION ? (
          <View>
            <SurfaceTextField
              autoFocus
              compact
              containerStyle={styles.descriptionField}
              label="Description"
              maxLength={DESCRIPTION_MAX_LENGTH}
              multiline
              placeholder="What’s included with this plan"
              style={styles.descriptionInput}
              textAlignVertical="top"
              value={description}
              onChangeText={(text) =>
                setDescription(String(text ?? '').slice(0, DESCRIPTION_MAX_LENGTH))
              }
            />
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
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
    paddingBottom: 4,
  },
  fieldReset: {
    marginBottom: 0,
  },
  descriptionField: {
    marginBottom: 4,
  },
  descriptionInput: {
    // Keep paddingTop in sync with SurfaceTextField’s multiline overlay placeholder
    // so the caret and placeholder sit on the same line.
    minHeight: 96,
    paddingTop: 0,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  bulletButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
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
});
