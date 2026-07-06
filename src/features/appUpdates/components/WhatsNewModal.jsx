import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Centered feature update modal — one feature, bullet-first copy.
 *
 * @param {{
 *   visible?: boolean;
 *   announcement: import('../constants/announcements').WhatsNewAnnouncement | null;
 *   onDismiss: () => void;
 *   onPrimaryAction?: () => void;
 *   primaryBusy?: boolean;
 * }} props
 */
export function WhatsNewModal({
  visible = false,
  announcement,
  onDismiss,
  onPrimaryAction,
  primaryBusy = false,
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.94);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 68,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          ...StyleSheet.absoluteFillObject,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.62)',
        },
        centerLayer: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 22,
          paddingTop: Math.max(insets.top, 16),
        },
        card: {
          alignSelf: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 22,
          borderWidth: 1,
          elevation: 16,
          maxWidth: 400,
          overflow: 'hidden',
          paddingBottom: 22,
          paddingHorizontal: 24,
          paddingTop: 26,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 36,
          width: '100%',
        },
        accentBar: {
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 3,
          height: 3,
          marginBottom: 18,
          width: 44,
        },
        iconBadge: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          marginBottom: 18,
          width: 48,
        },
        iconBadgeDark: {
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
        },
        iconBadgeLight: {
          backgroundColor: '#ffffff',
          borderColor: colors.border,
        },
        badge: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderRadius: 999,
          marginBottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        badgeText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.7,
          lineHeight: 32,
          marginBottom: 18,
        },
        bulletList: {
          gap: 12,
          marginBottom: 18,
        },
        bulletRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        bulletDot: {
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 999,
          height: 6,
          marginTop: 8,
          width: 6,
        },
        bulletText: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        actions: {
          gap: 10,
        },
      }),
    [colors, isDark, insets.bottom, insets.top],
  );

  if (!announcement) {
    return null;
  }

  const hasPrimary = Boolean(onPrimaryAction && announcement.primaryLabel);
  const heroIcon = announcement.icon ?? 'sparkles-outline';
  const iconColor = announcement.iconColor ?? colors.text;
  const iconLibrary = announcement.iconLibrary ?? 'ionicons';

  const heroIconNode =
    iconLibrary === 'material-community' ? (
      <MaterialCommunityIcons color={iconColor} name={heroIcon} size={24} />
    ) : (
      <Ionicons color={iconColor} name={heroIcon} size={24} />
    );

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.fill}>
        <Animated.View style={[styles.fill, { opacity }]}>
          <Pressable
            accessibilityLabel="Dismiss what's new"
            accessibilityRole="button"
            style={styles.fill}
            onPress={onDismiss}
          >
            <View style={styles.backdrop} />
          </Pressable>
        </Animated.View>

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <View style={styles.card}>
              <View style={styles.accentBar} />
              <View
                style={[
                  styles.iconBadge,
                  announcement.iconBadgeVariant === 'dark'
                    ? styles.iconBadgeDark
                    : announcement.iconBadgeVariant === 'light'
                      ? styles.iconBadgeLight
                      : null,
                ]}
              >
                {heroIconNode}
              </View>
              {announcement.badge ? (
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>{announcement.badge}</AppText>
                </View>
              ) : null}
              <AppText style={styles.title}>{announcement.title}</AppText>

              <View style={styles.bulletList}>
                {announcement.bullets.map((line) => (
                  <View key={line} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <AppText style={styles.bulletText}>{line}</AppText>
                  </View>
                ))}
              </View>

              <View style={styles.actions}>
                {hasPrimary ? (
                  <Button
                    fullWidth
                    loading={primaryBusy}
                    title={announcement.primaryLabel}
                    variant="primary"
                    onPress={onPrimaryAction}
                  />
                ) : null}
                <Button
                  fullWidth
                  title={hasPrimary ? announcement.secondaryLabel : 'Got it'}
                  variant={hasPrimary ? 'secondary' : 'primary'}
                  onPress={onDismiss}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
