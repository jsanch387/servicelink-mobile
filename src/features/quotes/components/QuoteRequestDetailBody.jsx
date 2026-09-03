import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  InfoSection,
  LocationSection,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { buildQuoteRequestActivityEvents } from '../utils/buildQuoteActivityEvents';
import { resolveQuoteRequestBrief } from '../utils/resolveQuoteRequestBrief';
import { QuoteActivityTimeline } from './QuoteActivityTimeline';
import { QuoteRequestCustomerCard } from './QuoteRequestCustomerCard';

/**
 * Quote request — customer first, then the request, then facts.
 *
 * @param {object} props
 * @param {{
 *   customerName?: string;
 *   email?: string;
 *   phone?: string;
 *   summary?: string;
 *   vehicle?: string;
 *   message?: string;
 *   serviceName?: string;
 *   requestedDateLabel?: string | null;
 *   requestedTimeLabel?: string | null;
 *   serviceAddressLine?: string;
 *   receivedAt?: string;
 *   vehicles?: string[];
 * }} props.model
 */
export function QuoteRequestDetailBody({ model }) {
  const { colors } = useTheme();
  const vehicleDisplay = String(model.vehicle ?? '').trim();
  const brief = useMemo(
    () =>
      resolveQuoteRequestBrief({
        message: model.message,
        serviceName: model.serviceName,
        summary: model.summary,
        vehicle: vehicleDisplay,
      }),
    [model.message, model.serviceName, model.summary, vehicleDisplay],
  );

  const requestedDateLabel = String(model.requestedDateLabel ?? '').trim();
  const requestedTimeLabel = String(model.requestedTimeLabel ?? '').trim();
  const serviceAddressLine = String(model.serviceAddressLine ?? '').trim();
  const receivedAt = String(model.receivedAt ?? '').trim();
  const activityEvents = useMemo(
    () => buildQuoteRequestActivityEvents({ receivedAt }),
    [receivedAt],
  );
  const requestMessage = brief.body;
  const catalogService = brief.headline;
  const hasSchedule = Boolean(brief.preferredTiming || requestedDateLabel || requestedTimeLabel);
  const vehicleRows = useMemo(() => {
    const listed = Array.isArray(model.vehicles) ? model.vehicles : [];
    const all = (listed.length > 0 ? listed : [vehicleDisplay]).map((v) => String(v ?? '').trim());
    return all
      .filter(Boolean)
      .map((value, index) => ({ key: `vehicle-${index}`, icon: 'car-sport-outline', value }));
  }, [model.vehicles, vehicleDisplay]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        column: {
          gap: 22,
        },
        requestText: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
          paddingVertical: 2,
        },
        fieldsStack: {
          gap: 18,
        },
      }),
    [colors],
  );

  const customerName = String(model.customerName ?? '').trim();
  const customerEmail = String(model.email ?? '').trim();
  const customerPhone = String(model.phone ?? '').trim();
  const showCustomer = Boolean(customerName || customerEmail || customerPhone);

  return (
    <View style={styles.column}>
      {showCustomer ? (
        <QuoteRequestCustomerCard
          customerName={customerName}
          email={customerEmail}
          phone={customerPhone}
        />
      ) : null}

      {requestMessage ? (
        <DetailsSectionCard bodyPadding="roomy" title="Request">
          <AppText style={styles.requestText}>{requestMessage}</AppText>
        </DetailsSectionCard>
      ) : null}

      {vehicleRows.length > 0 ? (
        <InfoSection
          bodyPadding="roomy"
          rowGap={14}
          rows={vehicleRows}
          title={vehicleRows.length > 1 ? 'Vehicles' : 'Vehicle'}
        />
      ) : null}

      {catalogService ? (
        <InfoSection
          bodyPadding="roomy"
          rowGap={14}
          rows={[{ icon: 'construct-outline', value: catalogService }]}
          title="Service"
        />
      ) : null}

      {hasSchedule ? (
        <DetailsSectionCard bodyPadding="roomy" title="Schedule">
          <View style={styles.fieldsStack}>
            {brief.preferredTiming ? (
              <DetailIconFieldRow
                centerIcon
                icon="calendar-outline"
                label="Preferred timing"
                labelUppercase={false}
                value={brief.preferredTiming}
              />
            ) : null}
            {requestedDateLabel ? (
              <DetailIconFieldRow
                centerIcon
                icon="calendar-outline"
                label="Date"
                labelUppercase={false}
                value={requestedDateLabel}
              />
            ) : null}
            {requestedTimeLabel ? (
              <DetailIconFieldRow
                centerIcon
                icon="time-outline"
                label="Time"
                labelUppercase={false}
                value={requestedTimeLabel}
              />
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      {serviceAddressLine ? <LocationSection address={serviceAddressLine} /> : null}

      <QuoteActivityTimeline events={activityEvents} />
    </View>
  );
}
