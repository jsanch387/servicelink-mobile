import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/** Matches phone / social input control height. */
const CONTROL_SIZE = 40;
/** Fills the square badge so the glyph reads as tall as the input. */
const BADGE_ICON_SIZE = 22;

const SOCIAL_PLATFORMS = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    placeholder: 'username',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: 'logo-tiktok',
    placeholder: 'username',
  },
];

/**
 * Social handles for booking-link edit Contact tab (`business_profiles.social_media`).
 *
 * @param {{
 *   styles: object;
 *   instagramInput: string;
 *   tiktokInput: string;
 *   onInstagramInputChange: (text: string) => void;
 *   onTiktokInputChange: (text: string) => void;
 * }} props
 */
export function BookingLinkEditSocialSection({
  styles: editStyles,
  instagramInput,
  tiktokInput,
  onInstagramInputChange,
  onTiktokInputChange,
}) {
  const { colors, isDark } = useTheme();
  const values = { instagram: instagramInput, tiktok: tiktokInput };
  const onChange = {
    instagram: onInstagramInputChange,
    tiktok: onTiktokInputChange,
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionBodyTight: {
          marginBottom: 4,
        },
        card: {
          marginTop: 4,
          overflow: 'hidden',
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        fields: {
          gap: 10,
        },
        field: {
          gap: 5,
        },
        label: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        inputRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        badge: {
          alignItems: 'center',
          backgroundColor: isDark ? '#1A1A1A' : '#111111',
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          flexShrink: 0,
          height: CONTROL_SIZE,
          justifyContent: 'center',
          maxHeight: CONTROL_SIZE,
          minHeight: CONTROL_SIZE,
          overflow: 'hidden',
          width: CONTROL_SIZE,
        },
        inputShell: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.shell : colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          flex: 1,
          flexDirection: 'row',
          height: CONTROL_SIZE,
          minHeight: CONTROL_SIZE,
          maxHeight: CONTROL_SIZE,
          paddingHorizontal: 12,
        },
        atSlot: {
          alignItems: 'center',
          height: CONTROL_SIZE,
          justifyContent: 'center',
          marginRight: 2,
          // Optical nudge — @ sits low vs TextInput baseline on iOS.
          paddingBottom: 2,
        },
        atPrefix: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: 18,
          ...Platform.select({
            android: { includeFontPadding: false, textAlignVertical: 'center' },
          }),
        },
        fieldInput: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          margin: 0,
          paddingHorizontal: 0,
          paddingVertical: 0,
          textAlignVertical: 'center',
          ...Platform.select({
            android: { includeFontPadding: false },
            ios: { height: CONTROL_SIZE },
          }),
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={editStyles.bioSection}>
      <AppText style={editStyles.sectionTitle}>Social</AppText>
      <AppText style={[editStyles.sectionBody, styles.sectionBodyTight]}>
        Shown on your booking page.
      </AppText>

      <SurfaceCard padding="none" style={[editStyles.editSectionCard, styles.card]}>
        <View style={styles.fields}>
          {SOCIAL_PLATFORMS.map((platform) => (
            <View key={platform.key} style={styles.field}>
              <AppText style={styles.label}>{platform.label}</AppText>
              <View style={styles.inputRow}>
                <View style={styles.badge}>
                  <Ionicons color="#FFFFFF" name={platform.icon} size={BADGE_ICON_SIZE} />
                </View>
                <View style={styles.inputShell}>
                  <View style={styles.atSlot}>
                    <AppText includeFontPadding={false} style={styles.atPrefix}>
                      @
                    </AppText>
                  </View>
                  <AppTextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={platform.placeholder}
                    placeholderTextColor={colors.textMuted}
                    style={styles.fieldInput}
                    value={values[platform.key]}
                    onChangeText={onChange[platform.key]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>
    </View>
  );
}
