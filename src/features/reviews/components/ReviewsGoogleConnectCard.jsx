import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  GOOGLE_CONNECT_CONNECTED_LABEL,
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CONNECTING_LABEL,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_TITLE,
} from '../constants/googleConnectCopy';
import { GoogleMark } from './GoogleMark';

/** Placeholder while Google connection status is still loading. */
export function ReviewsGoogleConnectCardSkeleton() {
  return (
    <SurfaceCard padding="md">
      <View style={skeletonStyles.card}>
        <View style={skeletonStyles.copy}>
          <SkeletonBox borderRadius={8} height={18} pulse width="58%" />
          <SkeletonBox borderRadius={8} height={14} pulse width="92%" />
        </View>
        <SkeletonBox borderRadius={10} height={36} pulse width="100%" />
      </View>
    </SurfaceCard>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    gap: 16,
  },
  copy: {
    gap: 8,
  },
});

/**
 * Google reviews card. `connected` shows the already-linked state and does not start OAuth.
 *
 * @param {{
 *   connected?: boolean;
 *   connecting?: boolean;
 *   connectError?: string | null;
 *   onConnect?: () => void;
 * }} props
 */
export function ReviewsGoogleConnectCard({
  connected = false,
  connecting = false,
  connectError = null,
  onConnect,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 16,
        },
        header: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        copy: {
          flex: 1,
          gap: 4,
          minWidth: 0,
        },
        checkWell: {
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 11,
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        lead: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        cta: {
          alignSelf: 'stretch',
        },
        ctaFace: {
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 10,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          minHeight: 36,
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        ctaPressed: {
          backgroundColor: '#e5e5e5',
        },
        ctaLabel: {
          color: '#000000',
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        error: {
          color: colors.danger,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
      }),
    [colors],
  );

  const title = connected ? GOOGLE_CONNECT_CONNECTED_TITLE : GOOGLE_CONNECT_TITLE;
  const lead = connected ? GOOGLE_CONNECT_CONNECTED_LEAD : GOOGLE_CONNECT_LEAD;

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.lead}>{lead}</AppText>
        </View>
        {connected ? (
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.checkWell}>
            <Ionicons color="#000000" name="checkmark" size={14} />
          </View>
        ) : null}
      </View>
      {connected ? (
        <View accessibilityRole="text" style={styles.ctaFace}>
          <GoogleMark size={14} />
          <AppText style={styles.ctaLabel}>{GOOGLE_CONNECT_CONNECTED_LABEL}</AppText>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: connecting, disabled: connecting }}
          disabled={connecting}
          hitSlop={6}
          style={styles.cta}
          onPress={onConnect}
        >
          {({ pressed }) => (
            <View style={[styles.ctaFace, pressed && !connecting && styles.ctaPressed]}>
              {connecting ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <GoogleMark size={14} />
              )}
              <AppText style={styles.ctaLabel}>
                {connecting ? GOOGLE_CONNECT_CONNECTING_LABEL : GOOGLE_CONNECT_CTA}
              </AppText>
            </View>
          )}
        </Pressable>
      )}
      {!connected && connectError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {connectError}
        </AppText>
      ) : null}
    </SurfaceCard>
  );
}
