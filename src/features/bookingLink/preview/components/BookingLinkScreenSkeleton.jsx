import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Full-screen placeholder while the owner booking profile is loading (matches preview layout).
 *
 * @param {{ coverHeight: number }} props
 */
export function BookingLinkScreenSkeleton({ coverHeight }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          backgroundColor: colors.shellElevated,
          height: coverHeight,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        },
        heroBone: {
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        profileBlock: {
          alignItems: 'center',
          marginTop: -64,
          paddingHorizontal: 24,
        },
        logoRing: {
          alignItems: 'center',
          backgroundColor: colors.borderStrong,
          borderRadius: 45,
          height: 136,
          justifyContent: 'center',
          marginBottom: 24,
          padding: 4,
          width: 136,
        },
        logoInner: {
          alignItems: 'center',
          backgroundColor: colors.border,
          borderColor: colors.shell,
          borderRadius: 38,
          borderWidth: 4,
          height: 128,
          justifyContent: 'center',
          overflow: 'hidden',
          width: 128,
        },
        nameWrap: {
          alignItems: 'center',
          maxWidth: 672,
          paddingHorizontal: 8,
          width: '100%',
        },
        typeBone: {
          marginTop: 10,
        },
        locationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          marginTop: 16,
        },
        contactBone: {
          borderRadius: 12,
          marginTop: 20,
        },
        tabsRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          flexDirection: 'row',
          gap: 24,
          marginTop: 26,
          paddingHorizontal: 20,
          paddingBottom: 14,
        },
        tabBone: {
          borderRadius: 6,
        },
        contentWrap: {
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        serviceCard: {
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        cardTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        line: {
          marginTop: 8,
        },
        footerBone: {
          borderRadius: 12,
          marginTop: 18,
        },
      }),
    [colors, coverHeight],
  );

  return (
    <View>
      <View style={styles.hero}>
        <SkeletonBox
          borderRadius={0}
          height={coverHeight}
          pulse
          style={styles.heroBone}
          width="100%"
        />
      </View>

      <View style={styles.profileBlock}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <SkeletonBox borderRadius={34} height={120} pulse width={120} />
          </View>
        </View>

        <View style={styles.nameWrap}>
          <SkeletonBox borderRadius={8} height={28} pulse width="64%" />
          <SkeletonBox borderRadius={6} height={12} pulse style={styles.typeBone} width="42%" />
        </View>

        <View style={styles.locationRow}>
          <SkeletonBox borderRadius={4} height={14} pulse width={14} />
          <SkeletonBox borderRadius={6} height={14} pulse width="48%" />
        </View>

        <SkeletonBox borderRadius={12} height={42} pulse style={styles.contactBone} width={148} />
      </View>

      <View style={styles.tabsRow}>
        <SkeletonBox borderRadius={6} height={16} pulse style={styles.tabBone} width={72} />
        <SkeletonBox borderRadius={6} height={16} pulse style={styles.tabBone} width={56} />
        <SkeletonBox borderRadius={6} height={16} pulse style={styles.tabBone} width={36} />
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.serviceCard}>
          <View style={styles.cardTopRow}>
            <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
            <SkeletonBox borderRadius={8} height={20} pulse width="28%" />
          </View>
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="36%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="88%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="72%" />
          <SkeletonBox borderRadius={12} height={42} pulse style={styles.footerBone} width="100%" />
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.cardTopRow}>
            <SkeletonBox borderRadius={8} height={18} pulse width="44%" />
            <SkeletonBox borderRadius={8} height={20} pulse width="30%" />
          </View>
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="40%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="92%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={styles.line} width="68%" />
          <SkeletonBox borderRadius={12} height={42} pulse style={styles.footerBone} width="100%" />
        </View>
      </View>
    </View>
  );
}
