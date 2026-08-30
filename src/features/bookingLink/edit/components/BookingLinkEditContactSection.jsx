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
      <View>
        <AppText style={editStyles.sectionTitle}>Phone number</AppText>
        <SurfacePhoneField
          accessibilityLabel="Phone number"
          compact
          containerStyle={editStyles.contactPhoneField}
          errorText={phoneInputError}
          label={null}
          placeholder="(555) 234-5678"
          prefixText="+1"
          value={phoneInput}
          onChangeText={onPhoneInputChange}
        />
      </View>

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
