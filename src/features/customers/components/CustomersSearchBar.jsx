import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { AppTextInput, SurfaceInputRow, useSurfaceInputTextStyle } from '../../../components/ui';
import { useTheme } from '../../../theme';

/** Same `cardSurface` shell as auth `SurfaceTextField` and shared `SurfaceInputRow`. */
export function CustomersSearchBar({ value, onChangeText }) {
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();

  return (
    <SurfaceInputRow
      left={
        <View
          style={{
            alignItems: 'center',
            height: 52,
            justifyContent: 'center',
            marginRight: 4,
            width: 22,
          }}
        >
          <Ionicons color={colors.textMuted} name="search-outline" size={18} />
        </View>
      }
      style={{ marginBottom: 14 }}
    >
      <AppTextInput
        onChangeText={onChangeText}
        placeholder="Search by name, email, or phone..."
        placeholderTextColor={colors.placeholder}
        style={inputTextStyle}
        value={value}
      />
    </SurfaceInputRow>
  );
}
