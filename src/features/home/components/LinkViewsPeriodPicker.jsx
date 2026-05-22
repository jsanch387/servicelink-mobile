import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, SurfaceCard } from '../../../components/ui';
import { showWebAccountFeatureAlert } from '../../subscription';
import { useTheme } from '../../../theme';
import { linkViewsPeriodAccessCopy } from '../constants/linkViewsAccessCopy';
import {
  LINK_VIEWS_PERIOD_DROPDOWN_LABELS,
  LINK_VIEWS_PERIOD_LABELS,
  LINK_VIEWS_PERIODS,
} from '../constants/linkViews';
import { isProOnlyLinkViewsPeriod } from '../utils/linkViewsPeriod';
import { LinkViewsPeriodSheetFooter } from './LinkViewsPeriodSheetFooter';

const PERIOD_SHEET_HEIGHT_PERCENT = 48;

function showLinkViewsPeriodWebAlert() {
  showWebAccountFeatureAlert({
    title: linkViewsPeriodAccessCopy.alertTitle,
    message: linkViewsPeriodAccessCopy.alertMessage,
  });
}

function LinkViewsPeriodOption({ label, selected, locked, onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        optionCard: {
          minHeight: 52,
          paddingHorizontal: 14,
          paddingVertical: 12,
          width: '100%',
        },
        optionCardSelected: {
          borderColor: colors.accent,
          borderWidth: 1.5,
        },
        optionCardLocked: {
          opacity: 0.88,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        labelLocked: {
          color: colors.textMuted,
          fontWeight: '500',
        },
        labelIdle: {
          color: colors.textMuted,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  const leadingIcon = locked
    ? { name: 'lock-closed', color: colors.textMuted }
    : selected
      ? { name: 'checkmark-circle', color: colors.accent }
      : { name: 'ellipse-outline', color: colors.textMuted };

  return (
    <Pressable
      accessibilityHint={
        locked ? 'Opens information about managing your account on the web' : undefined
      }
      accessibilityLabel={`${label}${locked ? ', available on the web' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: locked ? false : selected }}
      onPress={onPress}
    >
      {({ pressed }) => (
        <SurfaceCard
          outlined
          padding="none"
          style={[
            styles.optionCard,
            selected && !locked && styles.optionCardSelected,
            locked && styles.optionCardLocked,
            pressed && { opacity: 0.88 },
          ]}
        >
          <View style={styles.row}>
            <Ionicons color={leadingIcon.color} name={leadingIcon.name} size={22} />
            <View style={styles.labelCol}>
              <AppText
                numberOfLines={1}
                style={[
                  styles.label,
                  locked && styles.labelLocked,
                  !selected && !locked && styles.labelIdle,
                ]}
              >
                {label}
              </AppText>
            </View>
          </View>
        </SurfaceCard>
      )}
    </Pressable>
  );
}

/**
 * Period chip trigger + shared {@link BottomSheetModal} for link-views time range.
 */
export function LinkViewsPeriodPicker({
  period,
  onPeriodChange,
  hasProAccess = false,
  disabled = false,
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const dropdownLabel =
    LINK_VIEWS_PERIOD_DROPDOWN_LABELS[period] ?? LINK_VIEWS_PERIOD_DROPDOWN_LABELS['24h'];

  const close = useCallback(() => setOpen(false), []);

  const onSelect = useCallback(
    (key) => {
      if (!hasProAccess && isProOnlyLinkViewsPeriod(key)) {
        showLinkViewsPeriodWebAlert();
        return;
      }
      onPeriodChange(key);
      setOpen(false);
    },
    [hasProAccess, onPeriodChange],
  );

  const sheetFooter = useMemo(() => {
    if (hasProAccess) {
      return null;
    }
    return <LinkViewsPeriodSheetFooter onWebSignInPress={showLinkViewsPeriodWebAlert} />;
  }, [hasProAccess]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        triggerPill: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.surface : colors.shell,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          flexDirection: 'row',
          flexShrink: 0,
          gap: 4,
          paddingHorizontal: 11,
          paddingVertical: 7,
        },
        triggerLabel: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
        },
        optionList: {
          gap: 10,
          width: '100%',
        },
      }),
    [colors, isDark],
  );

  return (
    <>
      <Pressable
        accessibilityHint="Opens time range options"
        accessibilityLabel={`Time range: ${dropdownLabel}. Tap to change.`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [{ opacity: pressed && !disabled ? 0.72 : 1 }]}
      >
        <View style={[styles.triggerPill, disabled && { opacity: 0.45 }]}>
          <AppText numberOfLines={1} style={styles.triggerLabel}>
            {dropdownLabel}
          </AppText>
          <Ionicons color={colors.textMuted} name="chevron-down" size={14} />
        </View>
      </Pressable>

      <BottomSheetModal
        footer={sheetFooter}
        sheetHeightPercent={PERIOD_SHEET_HEIGHT_PERCENT}
        title="Time range"
        visible={open}
        onRequestClose={close}
      >
        <View style={styles.optionList}>
          {LINK_VIEWS_PERIODS.map((key) => (
            <LinkViewsPeriodOption
              key={key}
              label={LINK_VIEWS_PERIOD_LABELS[key]}
              locked={!hasProAccess && isProOnlyLinkViewsPeriod(key)}
              onPress={() => onSelect(key)}
              selected={key === period}
            />
          ))}
        </View>
      </BottomSheetModal>
    </>
  );
}
