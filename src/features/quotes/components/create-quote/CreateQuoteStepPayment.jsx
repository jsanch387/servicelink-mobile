import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  QUOTE_PAYMENT_METHOD,
  isQuotePaymentMethodAvailable,
  quotePaymentMethodSubtitle,
  quotePaymentMethodTitle,
  quotePaymentUnavailableNote,
} from '../../utils/quotePaymentOptions';

const METHOD_IDS = [
  QUOTE_PAYMENT_METHOD.DEPOSIT,
  QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
  QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
];

/**
 * @param {{
 *   selected: boolean;
 *   title: string;
 *   subtitle?: string | null;
 *   onPress: () => void;
 * }} props
 */
function PaymentOptionRow({ selected, title, subtitle, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          marginBottom: 12,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        iconCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 2,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={styles.press}
      onPress={onPress}
    >
      <SurfaceCard padding="none" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCol}>
            <Ionicons
              color={selected ? colors.text : colors.textMuted}
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
            />
          </View>
          <View style={styles.labelCol}>
            <AppText numberOfLines={2} style={styles.title}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText numberOfLines={2} style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

/**
 * Owner picks which ways the customer can pay. Nothing starts selected.
 *
 * @param {{
 *   loading?: boolean;
 *   loadError?: string | null;
 *   availability: import('../../utils/quotePaymentOptions').QuotePaymentAvailability;
 *   selectedMethods: string[];
 *   customerChooses?: boolean;
 *   showCustomerChooses?: boolean;
 *   onToggleMethod: (methodId: string) => void;
 *   onToggleCustomerChooses?: () => void;
 *   onRetry?: () => void;
 * }} props
 */
export function CreateQuoteStepPayment({
  loading = false,
  loadError = null,
  availability,
  selectedMethods,
  customerChooses = false,
  showCustomerChooses = false,
  onToggleMethod,
  onToggleCustomerChooses,
  onRetry,
}) {
  const { colors } = useTheme();
  const visibleMethods = METHOD_IDS.filter((id) => isQuotePaymentMethodAvailable(id, availability));
  const unavailableNote = quotePaymentUnavailableNote(availability);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          alignItems: 'center',
          paddingVertical: 28,
        },
        note: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 4,
        },
        retry: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading payment options" color={colors.accent} />
      </View>
    );
  }

  return (
    <View>
      {loadError ? <InlineCardError message={loadError} /> : null}
      {visibleMethods.map((methodId) => (
        <PaymentOptionRow
          key={methodId}
          selected={selectedMethods.includes(methodId)}
          subtitle={quotePaymentMethodSubtitle(methodId, availability.depositLabel)}
          title={quotePaymentMethodTitle(methodId)}
          onPress={() => onToggleMethod(methodId)}
        />
      ))}
      {showCustomerChooses ? (
        <PaymentOptionRow
          selected={customerChooses}
          subtitle="They choose how to pay."
          title="Let the customer choose"
          onPress={onToggleCustomerChooses}
        />
      ) : null}
      {unavailableNote ? <AppText style={styles.note}>{unavailableNote}</AppText> : null}
      {loadError && onRetry ? (
        <Button style={styles.retry} title="Try again" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
