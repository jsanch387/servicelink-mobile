import { Button } from './Button';

/**
 * Quiet destructive action — same gray secondary + trash treatment as quote detail
 * (“Delete quote”). Use this for entity deletes so they do not shout in red.
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
  return (
    <Button
      disabled={disabled}
      fullWidth={fullWidth}
      iconName={showIcon ? iconName : undefined}
      loading={loading}
      squared={squared}
      style={style}
      title={title}
      variant="secondary"
      onPress={onPress}
      {...rest}
    />
  );
}
