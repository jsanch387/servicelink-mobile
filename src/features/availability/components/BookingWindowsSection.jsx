import { Picker } from '@react-native-picker/picker';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { CatalogFeatureHowItWorksSheet } from '../../services/components/CatalogFeatureHowItWorksSheet';
import {
  BOOKING_WINDOWS_TITLE,
  BUFFER_TIME_HOW_IT_WORKS,
  BUFFER_TIME_OPTIONS,
  BUFFER_TIME_ROW,
  LEAD_TIME_HOW_IT_WORKS,
  LEAD_TIME_ROW,
} from '../constants/bookingWindowsCopy';
import { MINIMUM_NOTICE_OPTIONS } from '../utils/availabilityModel';
import { BookingWindowRow } from './BookingWindowRow';

function labelFor(options, value, noneLabel) {
  if (value === 'none') return noneLabel;
  return options.find((option) => option.value === value)?.label ?? noneLabel;
}

/**
 * Booking timing: lead time and buffer time in separate cards.
 *
 * @param {{
 *   leadTime: string;
 *   onLeadTimeChange: (next: string) => void;
 *   bufferTime: string;
 *   onBufferTimeChange: (next: string) => void;
 *   style?: object;
 * }} props
 */
export function BookingWindowsSection({
  leadTime,
  onLeadTimeChange,
  bufferTime,
  onBufferTimeChange,
  style,
}) {
  const { colors, isDark } = useTheme();
  const [pickerKind, setPickerKind] = useState(null);
  const [helpKind, setHelpKind] = useState(null);

  const pickerOptions = pickerKind === 'buffer' ? BUFFER_TIME_OPTIONS : MINIMUM_NOTICE_OPTIONS;
  const pickerValue = pickerKind === 'buffer' ? bufferTime : leadTime;
  const pickerTitle = pickerKind === 'buffer' ? BUFFER_TIME_ROW.title : LEAD_TIME_ROW.title;
  const helpCopy = helpKind === 'buffer' ? BUFFER_TIME_HOW_IT_WORKS : LEAD_TIME_HOW_IT_WORKS;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: 22,
        },
        titleRow: {
          marginBottom: 8,
          minHeight: 22,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        stack: {
          gap: 10,
        },
        pickerWrap: {
          marginHorizontal: -4,
          paddingBottom: Platform.OS === 'ios' ? 4 : 0,
          width: '100%',
        },
        pickerIOS: {
          height: 200,
          width: '100%',
        },
        wheelFooter: {
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleRow}>
        <AppText style={styles.sectionTitle}>{BOOKING_WINDOWS_TITLE}</AppText>
      </View>
      <View style={styles.stack}>
        <BookingWindowRow
          hint={LEAD_TIME_ROW.hint}
          infoLabel={LEAD_TIME_ROW.infoLabel}
          title={LEAD_TIME_ROW.title}
          valueLabel={labelFor(MINIMUM_NOTICE_OPTIONS, leadTime, LEAD_TIME_ROW.noneLabel)}
          onInfoPress={() => setHelpKind('lead')}
          onPress={() => setPickerKind('lead')}
        />
        <BookingWindowRow
          hint={BUFFER_TIME_ROW.hint}
          infoLabel={BUFFER_TIME_ROW.infoLabel}
          title={BUFFER_TIME_ROW.title}
          valueLabel={labelFor(BUFFER_TIME_OPTIONS, bufferTime, BUFFER_TIME_ROW.noneLabel)}
          onInfoPress={() => setHelpKind('buffer')}
          onPress={() => setPickerKind('buffer')}
        />
      </View>

      <BottomSheetModal
        allowBackdropClose
        fitContent
        footer={
          <View style={styles.wheelFooter}>
            <Button fullWidth title="Done" variant="primary" onPress={() => setPickerKind(null)} />
          </View>
        }
        showCloseButton={false}
        title={pickerTitle}
        visible={pickerKind != null}
        onRequestClose={() => setPickerKind(null)}
      >
        <View style={styles.pickerWrap}>
          <Picker
            dropdownIconColor={colors.textMuted}
            itemStyle={
              Platform.OS === 'ios'
                ? {
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: '600',
                    textAlign: 'left',
                  }
                : undefined
            }
            mode={Platform.OS === 'ios' ? 'spinner' : 'dropdown'}
            selectedValue={
              pickerOptions.some((option) => option.value === pickerValue)
                ? pickerValue
                : pickerOptions[0]?.value
            }
            style={Platform.OS === 'ios' ? styles.pickerIOS : { width: '100%' }}
            themeVariant={isDark ? 'dark' : 'light'}
            onValueChange={(itemValue) => {
              if (itemValue === '') return;
              const next = String(itemValue);
              if (pickerKind === 'buffer') {
                onBufferTimeChange(next);
                return;
              }
              onLeadTimeChange(next);
            }}
          >
            {pickerOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={
                  option.value === 'none'
                    ? pickerKind === 'buffer'
                      ? BUFFER_TIME_ROW.noneLabel
                      : LEAD_TIME_ROW.noneLabel
                    : option.label
                }
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </BottomSheetModal>

      <CatalogFeatureHowItWorksSheet
        intro={helpCopy.intro}
        items={helpCopy.items}
        optionalNote={helpCopy.optionalNote}
        title={helpCopy.title}
        visible={helpKind != null}
        onRequestClose={() => setHelpKind(null)}
      />
    </View>
  );
}
