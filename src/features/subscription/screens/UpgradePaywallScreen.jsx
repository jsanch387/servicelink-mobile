import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Button, SurfaceCard } from '../../../components/ui';
import { useProUpgradeCheckout } from '../hooks/useProUpgradeCheckout';

function PaywallThickCheck({ stroke = '#f3f4f6' }) {
  return (
    <Svg height={11} viewBox="0 0 24 24" width={14}>
      <Path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3.25}
      />
    </Svg>
  );
}

export function UpgradePaywallScreen() {
  const insets = useSafeAreaInsets();
  const { startUpgradeCheckout, submitting: checkoutSubmitting } = useProUpgradeCheckout();

  const styles = useMemo(() => {
    /** Full-screen stack (outside tab navigator) — safe area only, not `useBottomTabBarHeight`. */
    const scrollBottomPad = Math.max(insets.bottom + 24, 40);
    return StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: '#050608',
      },
      root: {
        flex: 1,
      },
      content: {
        flex: 1,
      },
      /** Vertically center the paywall block; scroll when content exceeds the viewport. */
      scrollInner: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
        paddingBottom: scrollBottomPad,
      },
      centerBlock: {
        alignSelf: 'stretch',
        width: '100%',
      },
      hero: {
        marginBottom: 0,
      },
      title: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 12,
      },
      subtitle: {
        color: '#9ca3af',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
        marginBottom: 24,
      },
      featuresList: {
        gap: 14,
      },
      featureRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 14,
      },
      featureIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
      },
      featureText: {
        color: '#e5e7eb',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
        lineHeight: 22,
      },
      bottom: {
        gap: 16,
        marginTop: 28,
      },
      planCard: {
        backgroundColor: 'rgba(6, 95, 70, 0.22)',
        borderColor: 'rgba(52, 211, 153, 0.42)',
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
      },
      planDealRibbon: {
        alignItems: 'center',
        backgroundColor: 'rgba(52, 211, 153, 0.14)',
        borderBottomColor: 'rgba(52, 211, 153, 0.22)',
        borderBottomWidth: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
      },
      planDealRibbonText: {
        color: '#a7f3d0',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.25,
      },
      planCardInner: {
        gap: 14,
        paddingBottom: 20,
        paddingHorizontal: 20,
        paddingTop: 18,
      },
      planCardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },
      planPill: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
      },
      planPillText: {
        color: '#f3f4f6',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      },
      planCadence: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
      },
      /** Stacked list price then hero price — left-aligned under header (ribbon stays centered). */
      priceBlock: {
        alignItems: 'flex-start',
        width: '100%',
      },
      planCompare: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.15,
        marginBottom: 4,
        textDecorationLine: 'line-through',
      },
      priceMainRow: {
        alignItems: 'baseline',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      },
      planPrice: {
        color: '#ecfdf5',
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -1,
      },
      planPeriod: {
        color: '#9ca3af',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 5,
      },
      planFoot: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 19,
        width: '100%',
      },
      ctaBtn: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
      },
    });
  }, [insets.top, insets.bottom]);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <AppShellGlow />
      <View style={styles.root}>
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerBlock}>
              <View style={styles.hero}>
                <AppText style={styles.title}>Keep using ServiceLink</AppText>
                <AppText style={styles.subtitle}>
                  Upgrade to Pro to unlock all features and run your business.
                </AppText>

                <View style={styles.featuresList}>
                  <View style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <PaywallThickCheck />
                    </View>
                    <AppText style={styles.featureText}>Bookings and calendar</AppText>
                  </View>
                  <View style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <PaywallThickCheck />
                    </View>
                    <AppText style={styles.featureText}>Customers and your booking link</AppText>
                  </View>
                  <View style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <PaywallThickCheck />
                    </View>
                    <AppText style={styles.featureText}>Payments and billing in one place</AppText>
                  </View>
                </View>
              </View>

              <View style={styles.bottom}>
                <SurfaceCard outlined={false} padding="none" style={styles.planCard}>
                  <View style={styles.planDealRibbon}>
                    <Ionicons color="#6ee7b7" name="pricetag" size={16} />
                    <AppText style={styles.planDealRibbonText}>Save $5/month on Pro</AppText>
                  </View>
                  <View style={styles.planCardInner}>
                    <View style={styles.planCardHeader}>
                      <View style={styles.planPill}>
                        <AppText style={styles.planPillText}>Pro</AppText>
                      </View>
                      <AppText style={styles.planCadence}>Billed monthly</AppText>
                    </View>
                    <View style={styles.priceBlock}>
                      <AppText style={styles.planCompare}>$15/mo</AppText>
                      <View style={styles.priceMainRow}>
                        <AppText style={styles.planPrice}>$10</AppText>
                        <AppText style={styles.planPeriod}>/ month</AppText>
                      </View>
                    </View>
                    <AppText style={styles.planFoot}>
                      Cancel anytime from Account in the app.
                    </AppText>
                  </View>
                </SurfaceCard>
                <Button
                  fullWidth
                  labelColor="#0b0c0f"
                  loading={checkoutSubmitting}
                  onPress={() => void startUpgradeCheckout()}
                  style={styles.ctaBtn}
                  title="Upgrade to Pro"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
