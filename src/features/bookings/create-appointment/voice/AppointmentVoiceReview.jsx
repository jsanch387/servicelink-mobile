import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfacePhoneField, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatPhoneInputAsYouType } from '../../../../utils/phone';
import {
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
} from '../../../../utils/vehicle';
import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import { ReviewStep } from '../steps/ReviewStep';
import {
  isVoiceReviewPhoneComplete,
  voiceDraftAddons,
  voiceDraftToReviewStepProps,
  voiceReviewPhoneError,
} from './appointmentVoiceDemo';

function VoiceReviewEditor({
  fieldKey,
  value,
  onChangeField,
  autoFocus = false,
  accessibilityLabel,
  ...inputProps
}) {
  return (
    <SurfaceTextField
      autoFocus={autoFocus}
      compact
      accessibilityLabel={accessibilityLabel}
      containerStyle={{ marginBottom: 0 }}
      returnKeyType="done"
      testID={`voice-review-${fieldKey}-input`}
      value={value}
      onChangeText={(next) => onChangeField(fieldKey, next)}
      {...inputProps}
    />
  );
}

function EditorStack({ children }) {
  return <View style={{ gap: 10 }}>{children}</View>;
}

/**
 * Voice review uses the same cards as manual booking, with tap-to-edit on every field.
 */
export function AppointmentVoiceReview({ draft, onChangeField, onSubmit }) {
  const { colors } = useTheme();
  const [editingKey, setEditingKey] = useState(null);
  const reviewProps = useMemo(() => voiceDraftToReviewStepProps(draft), [draft]);
  const phoneComplete = isVoiceReviewPhoneComplete(draft.phone);
  const phoneError = voiceReviewPhoneError(draft.phone);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 22,
        },
        heading: {
          gap: 6,
        },
        title: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  function endEdit() {
    setEditingKey(null);
  }

  function renderEditor(key) {
    if (key === 'customer' || key === 'phone') {
      return (
        <EditorStack>
          <VoiceReviewEditor
            accessibilityLabel="Customer name"
            autoFocus={key === 'customer'}
            fieldKey="customer"
            value={draft.customer ?? ''}
            onChangeField={onChangeField}
          />
          <SurfacePhoneField
            autoFocus={key === 'phone'}
            compact
            accessibilityLabel="Phone, required"
            containerStyle={{ marginBottom: 0 }}
            errorText={phoneError}
            prefixText="+1"
            returnKeyType="done"
            testID="voice-review-phone-input"
            value={formatPhoneInputAsYouType(draft.phone)}
            onChangeText={(next) => onChangeField('phone', next)}
          />
        </EditorStack>
      );
    }

    if (key === 'date' || key === 'time') {
      return (
        <EditorStack>
          <VoiceReviewEditor
            accessibilityLabel="Date"
            autoFocus={key === 'date'}
            fieldKey="date"
            value={formatScheduledDateUserFacing(draft.date) || (draft.date ?? '')}
            onChangeField={onChangeField}
          />
          <VoiceReviewEditor
            accessibilityLabel="Time"
            autoFocus={key === 'time'}
            fieldKey="time"
            value={draft.time ?? ''}
            onChangeField={onChangeField}
          />
        </EditorStack>
      );
    }

    if (key === 'service' || key === 'pricing' || key === 'addons') {
      const addons = voiceDraftAddons(draft);
      return (
        <EditorStack>
          <VoiceReviewEditor
            accessibilityLabel="Service"
            autoFocus={key === 'service'}
            fieldKey="service"
            value={draft.service ?? ''}
            onChangeField={onChangeField}
          />
          <VoiceReviewEditor
            accessibilityLabel="Price"
            autoFocus={key === 'pricing'}
            fieldKey="pricing"
            value={draft.pricing ?? ''}
            onChangeField={onChangeField}
          />
          {addons.map((addon, index) => (
            <EditorStack key={addon.id}>
              <VoiceReviewEditor
                accessibilityLabel="Add-on"
                autoFocus={key === 'addons' && index === 0}
                fieldKey={`addon-name-${index}`}
                label="Add-on"
                value={addon.name}
                onChangeField={(_field, value) =>
                  onChangeField(
                    'addons',
                    addons.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, name: value } : row,
                    ),
                  )
                }
              />
              <VoiceReviewEditor
                accessibilityLabel="Add-on price"
                autoCapitalize="none"
                autoCorrect={false}
                fieldKey={`addon-price-${index}`}
                keyboardType="number-pad"
                label="Price"
                prefixText="$"
                value={String(addon.priceLabel ?? '').replace(/[^\d.]/g, '')}
                onChangeField={(_field, value) =>
                  onChangeField(
                    'addons',
                    addons.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, priceLabel: `$${String(value ?? '').replace(/[^\d.]/g, '')}` }
                        : row,
                    ),
                  )
                }
              />
            </EditorStack>
          ))}
        </EditorStack>
      );
    }

    if (key === 'vehicle') {
      return (
        <EditorStack>
          <VoiceReviewEditor
            accessibilityLabel="Year"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            fieldKey="vehicleYear"
            keyboardType="number-pad"
            label="Year"
            maxLength={4}
            placeholder="2020"
            value={draft.vehicleYear ?? ''}
            onChangeField={(field, value) =>
              onChangeField(field, sanitizeVehicleYearInput(value))
            }
          />
          <VoiceReviewEditor
            accessibilityLabel="Make"
            autoCapitalize="words"
            fieldKey="vehicleMake"
            label="Make"
            maxLength={BOOKING_VEHICLE_MAKE_MAX}
            placeholder="Toyota"
            value={draft.vehicleMake ?? ''}
            onChangeField={(field, value) =>
              onChangeField(field, sanitizeVehicleTextInput(value, BOOKING_VEHICLE_MAKE_MAX))
            }
          />
          <VoiceReviewEditor
            accessibilityLabel="Model"
            autoCapitalize="words"
            fieldKey="vehicleModel"
            label="Model"
            maxLength={BOOKING_VEHICLE_MODEL_MAX}
            placeholder="Camry"
            value={draft.vehicleModel ?? ''}
            onChangeField={(field, value) =>
              onChangeField(field, sanitizeVehicleTextInput(value, BOOKING_VEHICLE_MODEL_MAX))
            }
          />
        </EditorStack>
      );
    }

    return (
      <VoiceReviewEditor
        accessibilityLabel="Address"
        autoFocus
        fieldKey="address"
        multiline
        value={draft.address ?? ''}
        onChangeField={onChangeField}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <AppText style={styles.title}>Review</AppText>
        <AppText style={styles.subtitle}>Tap Edit to change a section, Done to close it.</AppText>
      </View>

      <ReviewStep
        {...reviewProps}
        editTestIDPrefix="voice-review"
        editingField={editingKey}
        hideJobVehicleLine
        renderEditor={renderEditor}
        showNotes={false}
        onEditField={setEditingKey}
        onEndEdit={endEdit}
      />

      <Button
        disabled={!phoneComplete}
        fullWidth
        testID="appointment-voice-submit"
        title="Submit"
        variant="primary"
        onPress={onSubmit}
      />
    </View>
  );
}
