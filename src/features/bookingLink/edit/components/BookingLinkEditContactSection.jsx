import { View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { US_NANP_FORMATTED_MAX_LENGTH } from '../../../../utils/phone';

export function BookingLinkEditContactSection({
  styles,
  rootStyle,
  phoneInput,
  phoneInputError,
  onPhoneInputChange,
}) {
  return (
    <View style={[styles.contactSection, rootStyle]}>
      <AppText style={styles.sectionTitle}>Contact</AppText>
      <SurfaceCard style={styles.editSectionCard} padding="md">
        <SurfaceTextField
          containerStyle={[styles.infoField, styles.infoFieldLast]}
          errorText={phoneInputError ?? undefined}
          helperText={
            phoneInputError
              ? undefined
              : 'U.S. numbers only. Leave blank to hide the contact button.'
          }
          keyboardType="phone-pad"
          label="Phone number"
          maxLength={US_NANP_FORMATTED_MAX_LENGTH}
          placeholder="(555) 234-5678"
          value={phoneInput}
          onChangeText={onPhoneInputChange}
        />
      </SurfaceCard>
    </View>
  );
}
