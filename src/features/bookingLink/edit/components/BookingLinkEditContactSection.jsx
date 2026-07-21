import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { US_NANP_FORMATTED_MAX_LENGTH } from '../../../../utils/phone';
import { BookingLinkEditSocialSection } from './BookingLinkEditSocialSection';

export function BookingLinkEditContactSection({
  styles: editStyles,
  rootStyle,
  phoneInput,
  phoneInputError,
  onPhoneInputChange,
  instagramInput,
  tiktokInput,
  onInstagramInputChange,
  onTiktokInputChange,
}) {
  const { colors, isDark } = useTheme();
  const hasError = Boolean(phoneInputError?.trim());

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
        inputShell: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.shell : colors.shellElevated,
          borderColor: hasError ? colors.danger : colors.border,
          borderRadius: 10,
          borderWidth: hasError ? 1.5 : 1,
          flexDirection: 'row',
          gap: 8,
          height: 40,
          paddingHorizontal: 12,
        },
        phoneInput: {
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
            ios: { height: 40 },
          }),
        },
        errorLine: {
          color: colors.danger,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 16,
          marginTop: 8,
        },
      }),
    [colors, hasError, isDark],
  );

  return (
    <View style={[editStyles.contactSection, rootStyle]}>
      <AppText style={editStyles.sectionTitle}>Phone number</AppText>
      <AppText style={[editStyles.sectionBody, styles.sectionBodyTight]}>
        Shows a contact button on your booking link.
      </AppText>

      <SurfaceCard padding="none" style={[editStyles.editSectionCard, styles.card]}>
        <View style={styles.inputShell}>
          <Ionicons
            color={hasError ? colors.danger : colors.textMuted}
            name="call-outline"
            size={18}
          />
          <AppTextInput
            accessibilityLabel="Phone number"
            keyboardType="phone-pad"
            maxLength={US_NANP_FORMATTED_MAX_LENGTH}
            placeholder="(555) 234-5678"
            placeholderTextColor={colors.textMuted}
            style={styles.phoneInput}
            value={phoneInput}
            onChangeText={onPhoneInputChange}
          />
        </View>
      </SurfaceCard>
      {hasError ? (
        <AppText accessibilityLiveRegion="polite" style={styles.errorLine}>
          {phoneInputError.trim()}
        </AppText>
      ) : null}

      <BookingLinkEditSocialSection
        instagramInput={instagramInput}
        styles={editStyles}
        tiktokInput={tiktokInput}
        onInstagramInputChange={onInstagramInputChange}
        onTiktokInputChange={onTiktokInputChange}
      />
    </View>
  );
}
