import { View } from 'react-native';
import { AppText, SurfaceTextField } from '../../../../components/ui';
import { US_NANP_FORMATTED_MAX_LENGTH } from '../../../../utils/phone';

export function BookingLinkEditContactSection({ styles, phoneInput, onPhoneInputChange }) {
  return (
    <View style={styles.contactSection}>
      <AppText style={[styles.sectionTitle, styles.contactSectionTitle]}>Contact</AppText>
      <SurfaceTextField
        containerStyle={[styles.infoField, styles.infoFieldLast]}
        keyboardType="phone-pad"
        label="Phone number"
        maxLength={US_NANP_FORMATTED_MAX_LENGTH}
        placeholder="(555) 000-0000"
        value={phoneInput}
        onChangeText={onPhoneInputChange}
      />
    </View>
  );
}
