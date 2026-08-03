import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal } from '../../../components/ui';
import { BOTTOM_SHEET_GLASS_ENABLED } from '../../../components/ui/bottomSheetAppearance';
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

function showLinkViewsPeriodWebAlert() {
  showWebAccountFeatureAlert({
    title: linkViewsPeriodAccessCopy.alertTitle,
    message: linkViewsPeriodAccessCopy.alertMessage,
  });
}

function LinkViewsPeriodOption({ label, selected, locked, onPress }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          borderRadius: 14,
          overflow: 'hidden',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          backgroundColor: isDark ? '#0e0e0e' : colors.shellElevated,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 12,
          minHeight: 56,
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        rowPressed: {
          opacity: 0.88,
        },
        rowLocked: {
          opacity: 0.72,
        },
        label: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          minWidth: 0,
        },
        labelIdle: {
          color: colors.textMuted,
          fontWeight: '500',
        },
        labelLocked: {
          color: colors.textMuted,
          fontWeight: '500',
        },
      }),
    [colors, isDark],
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
      style={styles.root}
    >
      {({ pressed }) => (
        <View style={[styles.row, locked && styles.rowLocked, pressed && styles.rowPressed]}>
          <Ionicons color={leadingIcon.color} name={leadingIcon.name} size={22} />
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
      )}
    </Pressable>
  );
}

/**
 * Period chip trigger + glass bottom sheet for link-views time range.
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
          backgroundColor: isDark ? '#0e0e0e' : colors.shellElevated,
          borderRadius: 10,
          flexDirection: 'row',
          flexShrink: 0,
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        triggerLabel: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.05,
        },
        optionList: {
          gap: 10,
          paddingBottom: 8,
          paddingTop: 4,
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
        appearance={BOTTOM_SHEET_GLASS_ENABLED ? 'glass' : 'default'}
        fitContent
        footer={sheetFooter}
        showCloseButton
        showHeaderDivider
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
