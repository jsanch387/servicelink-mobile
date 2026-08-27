import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, SuccessMoment } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { CreatePaymentLinkAction } from '../components/CreatePaymentLinkAction';
import { CreatePaymentLinkPreview } from '../components/CreatePaymentLinkPreview';
import {
  CREATE_PAYMENT_LINK_READY_EXPIRES,
  CREATE_PAYMENT_LINK_READY_SUBTITLE,
  CREATE_PAYMENT_LINK_READY_TITLE,
} from '../constants';

export function CreatePaymentLinkReadyStep({
  amount,
  note,
  businessName,
  copied,
  onCopy,
  onShare,
  footerPadding,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        moment: {
          flex: 1,
          paddingHorizontal: SCREEN_GUTTER,
        },
        recap: {
          marginTop: 20,
        },
        expiresRow: {
          alignItems: 'center',
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 6,
          marginTop: 12,
        },
        expiresIcon: {
          alignItems: 'center',
          height: 16,
          justifyContent: 'center',
          width: 16,
        },
        expiresText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          lineHeight: 16,
        },
        actions: {
          alignItems: 'flex-start',
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 28,
          justifyContent: 'center',
          marginTop: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="create-payment-link-ready">
      <View style={[styles.moment, { paddingBottom: footerPadding }]}>
        <SuccessMoment
          body={CREATE_PAYMENT_LINK_READY_SUBTITLE}
          centered
          iconAccessibilityLabel="Payment link ready"
          title={CREATE_PAYMENT_LINK_READY_TITLE}
          variant="inline"
        >
          <Animated.View entering={FadeInDown.delay(280).duration(360)} style={styles.recap}>
            <CreatePaymentLinkPreview amount={amount} businessName={businessName} note={note} />
            <View style={styles.expiresRow}>
              <View style={styles.expiresIcon}>
                <Ionicons color={colors.textMuted} name="information-circle-outline" size={14} />
              </View>
              <AppText style={styles.expiresText}>{CREATE_PAYMENT_LINK_READY_EXPIRES}</AppText>
            </View>
            <View style={styles.actions}>
              <CreatePaymentLinkAction
                iconName="share-outline"
                label="Share"
                testID="create-payment-share-link"
                onPress={onShare}
              />
              <CreatePaymentLinkAction
                iconName={copied ? 'checkmark' : 'copy-outline'}
                label={copied ? 'Copied' : 'Copy'}
                testID="create-payment-copy-link"
                tint={copied ? colors.moneyPositive : undefined}
                onPress={onCopy}
              />
            </View>
          </Animated.View>
        </SuccessMoment>
      </View>
    </View>
  );
}
