import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, AppTextInput } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import {
  CREATE_PAYMENT_MAX_INTEGER_DIGITS,
  sanitizeCreatePaymentAmountInput,
} from '../utils/createPaymentAmount';

/** Uber-style amount entry: big dollars, decimal pad. */
export function CreatePaymentAmountHero({
  value,
  onChangeText,
  testID = 'create-payment-amount',
  compact = false,
  bold = false,
  textColor,
  mutedColor,
  placeholderTextColor,
  selectionColor,
  autoFocus = false,
}) {
  const { colors } = useTheme();
  const amountColor = textColor ?? colors.text;
  const dollarColor = bold ? amountColor : (mutedColor ?? colors.textMuted);
  const face = bold ? FONT_FAMILIES.bold : FONT_FAMILIES.semibold;
  const amountSize = bold ? 64 : 56;
  const dollarSize = bold ? 44 : 40;
  const amountHeight = bold ? 80 : 68;
  const [focused, setFocused] = useState(false);
  const digits = value?.length ? value : '0';
  const [digitsWidth, setDigitsWidth] = useState(amountSize * 0.7);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          overflow: 'visible',
          paddingBottom: compact ? (bold ? 12 : 8) : 28,
          paddingTop: compact ? (bold ? 10 : 4) : 8,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          alignSelf: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          minHeight: amountHeight,
          overflow: 'visible',
        },
        dollarCol: {
          height: amountHeight,
          justifyContent: 'center',
          paddingRight: 2,
        },
        dollar: {
          color: dollarColor,
          fontFamily: face,
          fontSize: dollarSize,
          transform: [{ translateY: bold ? 3 : 2 }],
        },
        inputCol: {
          height: amountHeight,
          justifyContent: 'center',
          overflow: 'visible',
          width: Math.max(digitsWidth, amountSize * 0.55),
        },
        input: {
          color: amountColor,
          fontFamily: face,
          fontSize: amountSize,
          height: amountHeight,
          includeFontPadding: false,
          letterSpacing: bold ? -2 : -1.6,
          padding: 0,
          textAlign: 'left',
          textAlignVertical: 'center',
          width: '100%',
        },
        measure: {
          fontFamily: face,
          fontSize: amountSize,
          left: 0,
          letterSpacing: bold ? -2 : -1.6,
          opacity: 0,
          position: 'absolute',
          top: 0,
        },
      }),
    [
      amountColor,
      amountHeight,
      amountSize,
      bold,
      compact,
      digitsWidth,
      dollarColor,
      dollarSize,
      face,
    ],
  );

  return (
    <View style={styles.wrap}>
      <AppText
        pointerEvents="none"
        style={styles.measure}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          if (next > 0 && Math.abs(next - digitsWidth) > 0.5) {
            setDigitsWidth(next);
          }
        }}
      >
        {digits}
      </AppText>
      <View style={styles.row}>
        <View style={styles.dollarCol}>
          <AppText style={styles.dollar}>$</AppText>
        </View>
        <View style={styles.inputCol}>
          <AppTextInput
            autoFocus={autoFocus}
            caretHidden={!focused}
            keyboardType="decimal-pad"
            maxLength={CREATE_PAYMENT_MAX_INTEGER_DIGITS + 3}
            placeholder={focused ? '' : '0'}
            placeholderTextColor={placeholderTextColor ?? colors.placeholder}
            selectionColor={selectionColor ?? colors.text}
            style={styles.input}
            testID={testID}
            value={value}
            onBlur={() => setFocused(false)}
            onChangeText={(next) => onChangeText(sanitizeCreatePaymentAmountInput(next))}
            onFocus={() => {
              setFocused(true);
              if (!value || value === '0') {
                onChangeText('');
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}
