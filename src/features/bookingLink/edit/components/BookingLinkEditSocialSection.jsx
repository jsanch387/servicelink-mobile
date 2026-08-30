import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const BADGE_SIZE = 52;
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
        card: {
          overflow: 'hidden',
          paddingHorizontal: 12,
          paddingVertical: 14,
        },
        fields: {
          gap: 10,
        },
        field: {
          gap: 5,
        },
        inputRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        badge: {
          alignItems: 'center',
          backgroundColor: isDark ? '#1A1A1A' : '#111111',
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          flexShrink: 0,
          height: BADGE_SIZE,
          justifyContent: 'center',
          width: BADGE_SIZE,
        },
        inputCol: {
          flex: 1,
          minWidth: 0,
        },
        inputField: {
          marginBottom: 0,
        },
      }),
    [colors, isDark],
  );

  return (
    <View>
      <AppText style={editStyles.sectionTitle}>Socials</AppText>

      <SurfaceCard padding="none" style={[editStyles.editSectionCard, styles.card]}>
        <View style={styles.fields}>
          {SOCIAL_PLATFORMS.map((platform) => (
            <View key={platform.key} style={styles.field}>
              <AppText style={editStyles.contactFieldLabel}>{platform.label}</AppText>
              <View style={styles.inputRow}>
                <View style={styles.badge}>
                  <Ionicons color="#FFFFFF" name={platform.icon} size={BADGE_ICON_SIZE} />
                </View>
                <View style={styles.inputCol}>
                  <SurfaceTextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    compact
                    containerStyle={styles.inputField}
                    label={null}
                    placeholder={platform.placeholder}
                    prefixText="@"
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
