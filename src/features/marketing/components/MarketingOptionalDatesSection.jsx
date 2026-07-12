import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MarketingDateField } from './MarketingDateField';

/**
 * Optional start/end dates with a single open calendar at a time.
 *
 * @param {object} props
 * @param {boolean} props.useDates
 * @param {(useDates: boolean) => void} props.onUseDatesChange
 * @param {string} props.startDateYyyyMmDd
 * @param {string} props.endDateYyyyMmDd
 * @param {(startDateYyyyMmDd: string) => void} props.onStartDateChange
 * @param {(endDateYyyyMmDd: string) => void} props.onEndDateChange
 * @param {string} [props.startErrorText]
 * @param {string} [props.endErrorText]
 */
export function MarketingOptionalDatesSection({
  useDates,
  onUseDatesChange,
  startDateYyyyMmDd,
  endDateYyyyMmDd,
  onStartDateChange,
  onEndDateChange,
  startErrorText,
  endErrorText,
}) {
  const { colors } = useTheme();
  const [activePicker, setActivePicker] = useState(/** @type {'start' | 'end' | null} */ (null));

  useEffect(() => {
    if (!useDates) setActivePicker(null);
  }, [useDates]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: 12,
        },
        toggleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        toggleCopy: {
          flex: 1,
          minWidth: 0,
        },
        toggleLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        toggleHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 2,
        },
        dateFields: {
          gap: 16,
        },
      }),
    [colors],
  );

  function handleUseDatesChange(next) {
    if (!next) setActivePicker(null);
    onUseDatesChange(next);
  }

  function handleStartChange(nextStart) {
    onStartDateChange(nextStart);
    if (endDateYyyyMmDd && nextStart > endDateYyyyMmDd) {
      onEndDateChange(nextStart);
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <AppText style={styles.toggleLabel}>Set dates</AppText>
          <AppText style={styles.toggleHint}>
            Optional — leave off and turn the offer on or off anytime.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Set dates"
          onValueChange={handleUseDatesChange}
          thumbColor={useDates ? '#f8fafc' : '#f4f4f5'}
          trackColor={{ false: colors.borderStrong, true: '#10b981' }}
          value={useDates}
        />
      </View>

      {useDates ? (
        <View style={styles.dateFields}>
          <MarketingDateField
            errorText={startErrorText}
            label="Starts"
            pickerOpen={activePicker === 'start'}
            valueYyyyMmDd={startDateYyyyMmDd}
            onChange={handleStartChange}
            onPickerOpenChange={(open) => setActivePicker(open ? 'start' : null)}
          />
          <MarketingDateField
            errorText={endErrorText}
            label="Ends"
            minimumDateYyyyMmDd={startDateYyyyMmDd}
            pickerOpen={activePicker === 'end'}
            valueYyyyMmDd={endDateYyyyMmDd}
            onChange={onEndDateChange}
            onPickerOpenChange={(open) => setActivePicker(open ? 'end' : null)}
          />
        </View>
      ) : null}
    </View>
  );
}
