import { Button } from './Button';
import { useTheme } from '../../theme';

/**
 * Destructive outline action — matches booking details “Delete booking”
 * (`variant="outline"`, thin danger border, trash icon, danger label).
 */
export function DeleteButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = true,
  iconName = 'trash-outline',
  showIcon = true,
  squared = false,
  style,
  ...rest
}) {
  const { colors } = useTheme();

  return (
    <Button
      disabled={disabled}
      fullWidth={fullWidth}
      iconName={showIcon ? iconName : undefined}
      loading={loading}
      outlineColor={colors.danger}
      outlineThin
      squared={squared}
      style={style}
      title={title}
      variant="outline"
      onPress={onPress}
      {...rest}
    />
  );
}
