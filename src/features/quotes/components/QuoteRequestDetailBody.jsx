import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

function QuoteRequestFieldRow({ colors, styles, icon, label, value }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconWrap}>
        <Ionicons color={colors.accentMuted} name={icon} size={19} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={styles.activityLabel}>{label}</AppText>
        <AppText style={styles.activityValue}>{value}</AppText>
      </View>
    </View>
  );
}

/**
 * @param {string} message
 * @param {string} summary
 * @param {string} vehicle
 */
function pickRequestDetailsBody(message, summary, vehicle) {
  const m = String(message ?? '').trim();
  const s = String(summary ?? '').trim();
  const v = String(vehicle ?? '').trim();
  if (m) return m;
  if (s && s !== v && s.toLowerCase() !== 'quote request') return s;
  return '';
}

/**
 * Request fields only — customer and activity are separate on the detail screen.
 *
 * @param {object} props
 * @param {{
 *   summary?: string;
 *   vehicle?: string;
 *   message?: string;
 *   serviceName?: string;
 *   preferredTiming?: string;
 * }} props.model
 */
export function QuoteRequestDetailBody({ model }) {
  const { colors } = useTheme();

  const vehicleDisplay = String(model.vehicle ?? '').trim();
  const serviceName = String(model.serviceName ?? '').trim();
  const preferredTiming = String(model.preferredTiming ?? '').trim();
  const detailsBody = useMemo(
    () => pickRequestDetailsBody(model.message, model.summary, vehicleDisplay),
    [model.message, model.summary, vehicleDisplay],
  );

  const hasTopRows =
    serviceName.length > 0 || preferredTiming.length > 0 || vehicleDisplay.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        requestStack: {
          gap: 18,
          paddingVertical: 2,
        },
        activityRow: {
          flexDirection: 'row',
          gap: 14,
        },
        activityIconWrap: {
          paddingTop: 2,
          width: 22,
        },
        activityLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 4,
          textTransform: 'uppercase',
        },
        activityValue: {
          color: colors.textSecondary,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
        dividerWrap: {
          marginTop: 2,
        },
        detailsBlock: {
          paddingTop: 4,
        },
        detailsParagraph: {
          color: colors.textSecondary,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
        emptyNote: {
          color: colors.textMuted,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  const detailsContent =
    detailsBody.length > 0 ? (
      <AppText style={styles.detailsParagraph}>{detailsBody}</AppText>
    ) : (
      <AppText style={styles.emptyNote}>No written details.</AppText>
    );

  return (
    <DetailsSectionCard title="Request">
      <View style={styles.requestStack}>
        {serviceName.length > 0 ? (
          <QuoteRequestFieldRow
            colors={colors}
            icon="construct-outline"
            label="Service"
            styles={styles}
            value={serviceName}
          />
        ) : null}
        {preferredTiming.length > 0 ? (
          <QuoteRequestFieldRow
            colors={colors}
            icon="calendar-outline"
            label="Preferred timing"
            styles={styles}
            value={preferredTiming}
          />
        ) : null}
        {vehicleDisplay.length > 0 ? (
          <QuoteRequestFieldRow
            colors={colors}
            icon="car-sport-outline"
            label="Vehicle"
            styles={styles}
            value={vehicleDisplay}
          />
        ) : null}

        {hasTopRows ? (
          <>
            <View style={styles.dividerWrap}>
              <Divider />
            </View>
            <View style={styles.detailsBlock}>{detailsContent}</View>
          </>
        ) : (
          detailsContent
        )}
      </View>
    </DetailsSectionCard>
  );
}

/**
 * @param {object} props
 * @param {{ receivedAt?: string }} props.model
 */
export function QuoteRequestActivitySection({ model }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        activityStack: {
          gap: 14,
          paddingTop: 2,
        },
        activityRow: {
          flexDirection: 'row',
          gap: 14,
        },
        activityIconWrap: {
          paddingTop: 2,
          width: 22,
        },
        activityLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 4,
          textTransform: 'uppercase',
        },
        activityValue: {
          color: colors.textSecondary,
          fontSize: 15,
          fontFamily: FONT_FAMILIES.medium,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard title="Activity">
      <View style={styles.activityStack}>
        <View style={styles.activityRow}>
          <View style={styles.activityIconWrap}>
            <Ionicons color={colors.accentMuted} name="time-outline" size={19} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.activityLabel}>Received</AppText>
            <AppText style={styles.activityValue}>{model.receivedAt ?? '—'}</AppText>
          </View>
        </View>
      </View>
    </DetailsSectionCard>
  );
}
