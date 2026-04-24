import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatPhoneForDisplay } from '../../../../utils/phone';
import { customerInitials } from '../utils/customerInitials';
import { customerSegmentColor, customerSegmentLabel } from '../../utils/customerSegmentDisplay';

const CONTACT_ICON_SIZE = 18;
const CONTACT_LINE_HEIGHT = 20;
/** Optical nudge so the glyph centers with the first text line (14 / 20). */
const CONTACT_ICON_PAD_TOP = Math.max(0, Math.round((CONTACT_LINE_HEIGHT - CONTACT_ICON_SIZE) / 2));

function ContactLine({ accessibilityLabel, disabled, icon, onPress, value }) {
  const { colors } = useTheme();
  const interactive = Boolean(onPress) && !disabled;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          alignSelf: 'stretch',
          borderRadius: 10,
          marginHorizontal: -6,
          opacity: disabled ? 0.42 : 1,
          paddingHorizontal: 6,
          paddingVertical: 6,
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
        },
        iconRail: {
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: CONTACT_ICON_PAD_TOP,
          width: 28,
        },
        value: {
          color: interactive ? colors.linkSubtle : colors.textMuted,
          flex: 1,
          fontSize: 14,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: CONTACT_LINE_HEIGHT,
          marginLeft: 10,
          minWidth: 0,
          textDecorationLine: interactive ? 'underline' : 'none',
        },
      }),
    [colors, disabled, interactive],
  );

  const iconColor = interactive ? colors.textMuted : colors.placeholder;

  const body = (
    <View style={styles.row}>
      <View style={styles.iconRail}>
        <Ionicons color={iconColor} name={icon} size={CONTACT_ICON_SIZE} />
      </View>
      <AppText numberOfLines={2} style={styles.value}>
        {value}
      </AppText>
    </View>
  );

  if (!onPress || disabled) {
    return <View style={styles.press}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.press, pressed && { opacity: 0.65 }]}
    >
      {body}
    </Pressable>
  );
}

export function CustomerProfileContactCard({
  email,
  fullName,
  hasCallablePhone,
  onCall,
  onEmail,
  phone,
  segment,
}) {
  const { colors } = useTheme();
  const initials = useMemo(() => customerInitials(fullName), [fullName]);
  const tag = customerSegmentLabel(segment);
  const accent = customerSegmentColor(segment);
  const phoneDisplay = formatPhoneForDisplay(phone) || 'No phone number';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingVertical: 16,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.cardBorder,
          borderRadius: 24,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        initials: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.35,
        },
        name: {
          color: colors.text,
          flex: 1,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 26,
          marginLeft: 12,
          minWidth: 0,
        },
        pill: {
          backgroundColor: `${accent}24`,
          borderRadius: 999,
          flexShrink: 0,
          marginLeft: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        pillText: {
          color: accent,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
        },
        dividerWrap: {
          marginBottom: 10,
          marginTop: 14,
        },
        contactBlock: {
          rowGap: 10,
        },
      }),
    [accent, colors],
  );

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <AppText style={styles.initials}>{initials}</AppText>
        </View>
        <AppText numberOfLines={2} style={styles.name}>
          {fullName}
        </AppText>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>{tag}</AppText>
        </View>
      </View>

      <View style={styles.dividerWrap}>
        <Divider />
      </View>

      <View style={styles.contactBlock}>
        <ContactLine
          accessibilityLabel={hasCallablePhone ? 'Call phone number' : undefined}
          disabled={!hasCallablePhone}
          icon="call-outline"
          onPress={hasCallablePhone ? onCall : undefined}
          value={phoneDisplay}
        />
        <ContactLine
          accessibilityLabel="Compose email"
          icon="mail-outline"
          onPress={onEmail}
          value={email}
        />
      </View>
    </SurfaceCard>
  );
}
