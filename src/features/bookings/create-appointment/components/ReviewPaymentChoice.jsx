import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatCreatePaymentDollars } from '../../../payments/create-payment/utils/createPaymentAmount';
import { REVIEW_PAYMENT_CHOICE } from '../utils/resolveReviewDepositOffer';

/**
 * Review payment choice: collect later, or send the business deposit link.
 *
 * @param {{
 *   depositUsd: number;
 *   choice?: string;
 *   onChangeChoice?: (next: string) => void;
 * }} props
 */
export function ReviewPaymentChoice({
  depositUsd = 0,
  choice = REVIEW_PAYMENT_CHOICE.NONE,
  onChangeChoice,
}) {
  const { colors } = useTheme();
  const depositLabel = formatCreatePaymentDollars(depositUsd);

  const options = useMemo(
    () => [
      {
        key: REVIEW_PAYMENT_CHOICE.NONE,
        title: 'No payment now',
        subtitle: 'Collect later, in person',
        icon: 'hand-left-outline',
      },
      {
        key: REVIEW_PAYMENT_CHOICE.DEPOSIT,
        title: 'Send a deposit link',
        subtitle: `${depositLabel} · we’ll text or email them`,
        icon: 'wallet-outline',
      },
    ],
    [depositLabel],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 8,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          overflow: 'hidden',
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 62,
        },
        face: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 13,
          width: '100%',
        },
        iconWell: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderRadius: 12,
          height: 36,
          justifyContent: 'center',
          marginRight: 12,
          width: 36,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        optionTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.25,
        },
        optionSubtitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 18,
          marginTop: 2,
        },
        radioCol: {
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 10,
          width: 22,
        },
        radio: {
          alignItems: 'center',
          borderRadius: 11,
          borderWidth: 1.5,
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        radioDot: {
          borderRadius: 5,
          height: 10,
          width: 10,
        },
        hintRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 6,
          marginTop: 8,
          paddingHorizontal: 4,
        },
        hintIcon: {
          alignItems: 'center',
          height: 18,
          justifyContent: 'center',
          width: 14,
        },
        hintTextCol: {
          flex: 1,
          minWidth: 0,
        },
        hint: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          lineHeight: 18,
        },
      }),
    [colors],
  );

  const holdCopy =
    choice === REVIEW_PAYMENT_CHOICE.DEPOSIT
      ? 'We’ll send the link. Booking confirms when they pay.'
      : null;

  return (
    <View style={styles.section} testID="review-payment-choice">
      <AppText style={styles.title}>Payment</AppText>
      <View style={styles.card}>
        {options.map((option, index) => {
          const selected = choice === option.key;
          return (
            <View key={option.key}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                testID={`review-payment-choice-${option.key}`}
                onPress={() => onChangeChoice?.(option.key)}
              >
                {({ pressed }) => (
                  <View style={[styles.face, pressed && { opacity: 0.72 }]}>
                    <View style={styles.iconWell}>
                      <Ionicons color={colors.text} name={option.icon} size={18} />
                    </View>
                    <View style={styles.textCol}>
                      <AppText style={styles.optionTitle}>{option.title}</AppText>
                      <AppText style={styles.optionSubtitle}>{option.subtitle}</AppText>
                    </View>
                    <View style={styles.radioCol}>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected
                              ? (colors.buttonPrimaryBg ?? colors.text)
                              : colors.borderStrong,
                          },
                        ]}
                      >
                        {selected ? (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: colors.buttonPrimaryBg ?? colors.text },
                            ]}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
      {holdCopy ? (
        <View style={styles.hintRow}>
          <View style={styles.hintIcon}>
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={14} />
          </View>
          <View style={styles.hintTextCol}>
            <AppText style={styles.hint}>{holdCopy}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
