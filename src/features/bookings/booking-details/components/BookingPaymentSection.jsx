import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * `$80.00 due` becomes a bold figure plus a quiet suffix.
 * Anything else stays one trailing line.
 *
 * @param {string} detail
 * @returns {{ figure: string; suffix: string } | null}
 */
function splitPrice(detail) {
  const raw = String(detail ?? '').trim();
  if (!raw) return null;
  const money = raw.match(/^(\$[\d,]+(?:\.\d{2})?)\s*(.*)$/);
  if (!money) return { figure: raw, suffix: '' };
  return { figure: money[1], suffix: String(money[2] ?? '').trim() };
}

/**
 * Minimal payment line: method on the left, price on the right.
 *
 * @param {object} props
 * @param {object} props.payment — output of {@link buildBookingPaymentSection}
 */
export function BookingPaymentSection({ payment }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '400',
          lineHeight: 21,
        },
        priceCol: {
          alignItems: 'baseline',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginLeft: 12,
          maxWidth: '52%',
        },
        figureWrap: {
          flexShrink: 1,
          minWidth: 0,
        },
        figure: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          lineHeight: 21,
          textAlign: 'right',
        },
        suffixWrap: {
          marginLeft: 4,
        },
        suffix: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 18,
        },
      }),
    [colors],
  );

  if (!payment?.visible || !payment.status) {
    return null;
  }

  const status = String(payment.status).trim();
  const price = splitPrice(payment.detail);

  return (
    <DetailsSectionCard title="Payment">
      <View accessibilityLabel={payment.accessibilityLabel || status} style={styles.row}>
        <View style={styles.labelCol}>
          <AppText numberOfLines={1} style={styles.label}>
            {status}
          </AppText>
        </View>
        {price ? (
          <View style={styles.priceCol}>
            <View style={styles.figureWrap}>
              <AppText numberOfLines={1} style={styles.figure}>
                {price.figure}
              </AppText>
            </View>
            {price.suffix ? (
              <View style={styles.suffixWrap}>
                <AppText style={styles.suffix}>{price.suffix}</AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </DetailsSectionCard>
  );
}
