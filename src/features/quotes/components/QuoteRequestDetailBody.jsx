import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailIconFieldRow, DetailsSectionCard, Divider } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

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
          <DetailIconFieldRow icon="construct-outline" label="Service" value={serviceName} />
        ) : null}
        {preferredTiming.length > 0 ? (
          <DetailIconFieldRow
            icon="calendar-outline"
            label="Preferred timing"
            value={preferredTiming}
          />
        ) : null}
        {vehicleDisplay.length > 0 ? (
          <DetailIconFieldRow icon="car-sport-outline" label="Vehicle" value={vehicleDisplay} />
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
  return (
    <DetailsSectionCard title="Activity">
      <View style={{ gap: 14, paddingTop: 2 }}>
        <DetailIconFieldRow icon="time-outline" label="Received" value={model.receivedAt ?? '—'} />
      </View>
    </DetailsSectionCard>
  );
}
