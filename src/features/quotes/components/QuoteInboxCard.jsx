import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

/**
 * Inbox row: who plus the status pill on top, vehicle beneath, then the timing
 * the job hangs on under a hairline. Amounts and the message live on detail.
 *
 * @param {object} props
 * @param {'request' | 'sent'} props.variant
 * @param {string} props.customerName
 * @param {string} [props.serviceLabel] Preferred over the vehicle when the work is known.
 * @param {string} [props.vehicleLabel]
 * @param {string} [props.vehicleExtraLabel] e.g. `+1 more` when several vehicles are on the quote.
 * @param {string} [props.timingLabel] e.g. `Tomorrow · 2:30 PM`.
 * @param {string} props.statusLabel
 * @param {string} props.statusRaw
 * @param {() => void} props.onPress
 */
export function QuoteInboxCard({
  variant,
  customerName,
  serviceLabel = '',
  vehicleLabel = '',
  vehicleExtraLabel = '',
  timingLabel = '',
  statusLabel,
  statusRaw,
  onPress,
}) {
  const { colors, isDark } = useTheme();
  const pillTheme = useMemo(
    () => getQuoteStatusPillTheme(statusRaw, colors, isDark),
    [colors, isDark, statusRaw],
  );
  const isRequest = variant === 'request';
  const service = String(serviceLabel ?? '').trim();
  /** A quote we built names the work; a raw request usually only knows the vehicle. */
  const meta = service || String(vehicleLabel ?? '').trim();
  const metaExtra = service ? '' : String(vehicleExtraLabel ?? '').trim();
  const timing = String(timingLabel ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        headRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        headCol: {
          flex: 1,
          minWidth: 0,
        },
        customerName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        metaRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          gap: 8,
          marginTop: 3,
          width: '100%',
        },
        metaCol: {
          flexShrink: 1,
          minWidth: 0,
        },
        meta: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          letterSpacing: -0.1,
          lineHeight: 19,
        },
        metaExtraCol: {
          flexShrink: 0,
        },
        metaExtra: {
          color: colors.placeholder,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.05,
          lineHeight: 17,
        },
        pillCol: {
          flexShrink: 0,
        },
        pill: {
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: 0.05,
          lineHeight: 15,
        },
        footRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          marginTop: 14,
          width: '100%',
        },
        timingCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        chevronCol: {
          alignItems: 'center',
          flexShrink: 0,
          justifyContent: 'center',
          width: 20,
        },
        timingText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: -0.05,
          lineHeight: 18,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint={isRequest ? 'Opens quote request details' : 'Opens sent quote details'}
      accessibilityLabel={`Quote for ${customerName}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={pressed ? { opacity: 0.88 } : null}>
          <SurfaceCard padding="none" style={styles.card}>
            <View style={styles.headRow}>
              <View style={styles.headCol}>
                <AppText numberOfLines={1} style={styles.customerName}>
                  {customerName}
                </AppText>
                {meta ? (
                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <AppText numberOfLines={1} style={styles.meta}>
                        {meta}
                      </AppText>
                    </View>
                    {metaExtra ? (
                      <View style={styles.metaExtraCol}>
                        <AppText numberOfLines={1} style={styles.metaExtra}>
                          {metaExtra}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <View style={styles.pillCol}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: pillTheme.backgroundColor,
                      borderColor: pillTheme.borderColor,
                    },
                  ]}
                >
                  <AppText style={[styles.pillText, { color: pillTheme.color }]}>
                    {statusLabel}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.footRow}>
              <View style={styles.timingCol}>
                {timing ? (
                  <AppText numberOfLines={1} style={styles.timingText}>
                    {timing}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.chevronCol}>
                <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
              </View>
            </View>
          </SurfaceCard>
        </View>
      )}
    </Pressable>
  );
}
