import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_CREATE_FIRST_BODY,
  SUBSCRIPTIONS_CREATE_FIRST_CTA,
  SUBSCRIPTIONS_CREATE_FIRST_HOW_LABEL,
  SUBSCRIPTIONS_CREATE_FIRST_POINTS,
  SUBSCRIPTIONS_CREATE_FIRST_TITLE,
} from '../constants/setupCopy';

/**
 * Ready-to-create: hero CTA, then how subscriptions work.
 * @param {object} props
 * @param {() => void} props.onCreatePress
 */
export function SubscriptionsCreateFirstGuide({ onCreatePress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 16,
          width: '100%',
        },
        hero: {
          gap: 16,
          width: '100%',
        },
        headBlock: {
          gap: 6,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.45,
          lineHeight: 27,
        },
        body: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        howLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 8,
        },
        pointsCard: {
          marginBottom: 0,
          overflow: 'hidden',
          paddingHorizontal: 0,
          paddingVertical: 4,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 14,
          width: '100%',
        },
        rowDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 60,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          marginRight: 12,
          width: 36,
        },
        rowText: {
          flex: 1,
          minWidth: 0,
        },
        rowTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
          lineHeight: 20,
        },
        rowBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 2,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <SurfaceCard outlined padding="md" style={styles.hero}>
        <View style={styles.headBlock}>
          <AppText style={styles.title}>{SUBSCRIPTIONS_CREATE_FIRST_TITLE}</AppText>
          <AppText style={styles.body}>{SUBSCRIPTIONS_CREATE_FIRST_BODY}</AppText>
        </View>
        <Button
          fullWidth
          labelColor="#0b0c0f"
          title={SUBSCRIPTIONS_CREATE_FIRST_CTA}
          variant="surfaceLight"
          onPress={onCreatePress}
        />
      </SurfaceCard>

      <View>
        <AppText style={styles.howLabel}>{SUBSCRIPTIONS_CREATE_FIRST_HOW_LABEL}</AppText>
        <SurfaceCard outlined padding="none" style={styles.pointsCard}>
          {SUBSCRIPTIONS_CREATE_FIRST_POINTS.map((point, index) => (
            <View key={point.key}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons color={colors.text} name={point.icon} size={18} />
                </View>
                <View style={styles.rowText}>
                  <AppText style={styles.rowTitle}>{point.title}</AppText>
                  <AppText style={styles.rowBody}>{point.body}</AppText>
                </View>
              </View>
            </View>
          ))}
        </SurfaceCard>
      </View>
    </View>
  );
}
