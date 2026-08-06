import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  DetailIconFieldRow,
  DetailsSectionCard,
  InlineCardError,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  formatCadenceLabel,
  formatPlanPriceCents,
  PLAN_CADENCE_OPTIONS,
} from '../constants/planCadence';
import { MOCK_MEMBERSHIPS_PUBLIC_LINK } from '../mock/mockSubscriptions';

/**
 * Plan detail (mock) — snapshot + share link. Edit comes later.
 */
export function SubscriptionPlanDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const plan = route.params?.plan ?? null;
  const [linkCopied, setLinkCopied] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: plan?.name ? plan.name : 'Plan',
    });
  }, [navigation, plan?.name]);

  const orderedKeys = useMemo(() => {
    const keys = Array.isArray(plan?.offeredCadenceKeys) ? plan.offeredCadenceKeys : [];
    return PLAN_CADENCE_OPTIONS.map((o) => o.key).filter((k) => keys.includes(k));
  }, [plan?.offeredCadenceKeys]);

  const handleCopyLink = useCallback(async () => {
    await Clipboard.setStringAsync(MOCK_MEMBERSHIPS_PUBLIC_LINK);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 22,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 30,
          letterSpacing: -0.6,
          lineHeight: 36,
        },
        renews: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          marginTop: 4,
        },
        optionsStack: {
          gap: 12,
        },
        optionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        optionText: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          minWidth: 0,
        },
        linkHint: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 8,
        },
      }),
    [colors],
  );

  if (!plan?.id) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not open this plan. Go back and try again." />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <DetailsSectionCard title="Price">
          <AppText style={styles.price}>{formatPlanPriceCents(plan.priceCents)}</AppText>
          <AppText style={styles.renews}>Charged each time the plan renews</AppText>
        </DetailsSectionCard>

        <DetailsSectionCard bodyPadding="roomy" title="How often">
          {orderedKeys.length === 0 ? (
            <DetailIconFieldRow
              icon="calendar-outline"
              label="Options"
              labelUppercase={false}
              value="Customer picks when they sign up"
            />
          ) : (
            <View style={styles.optionsStack}>
              {orderedKeys.map((key) => (
                <View key={key} style={styles.optionRow}>
                  <Ionicons color={colors.textMuted} name="checkmark-circle-outline" size={18} />
                  <AppText style={styles.optionText}>{formatCadenceLabel(key)}</AppText>
                </View>
              ))}
            </View>
          )}
        </DetailsSectionCard>

        <View>
          <Button
            fullWidth
            title={linkCopied ? 'Link copied' : 'Copy memberships link'}
            variant="surfaceLight"
            labelColor="#0b0c0f"
            onPress={() => void handleCopyLink()}
          />
          <AppText style={styles.linkHint}>
            {MOCK_MEMBERSHIPS_PUBLIC_LINK.replace(/^https?:\/\//, '')}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
