import { View } from 'react-native';
import { AppText, SurfacePhoneField } from '../../../../components/ui';
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
  return (
    <View style={[editStyles.contactSection, rootStyle]}>
      <AppText style={editStyles.sectionTitle}>Phone number</AppText>
      <SurfacePhoneField
        containerStyle={editStyles.contactPhoneField}
        errorText={phoneInputError}
        label={null}
        placeholder="(555) 234-5678"
        prefixText="+1"
        value={phoneInput}
        onChangeText={onPhoneInputChange}
      />

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
