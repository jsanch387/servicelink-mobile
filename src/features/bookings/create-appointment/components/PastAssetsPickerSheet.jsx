import { BottomSheetModal } from '../../../../components/ui';
import { ChoiceRow } from './ChoiceRow';

/**
 * Compact picker for a returning customer's saved assets (vehicles now, pets later).
 *
 * @param {{
 *   visible: boolean;
 *   title?: string;
 *   items?: Array<{ id: string; label: string }>;
 *   selectedId?: string | null;
 *   onSelect: (item: { id: string; label: string }) => void;
 *   onRequestClose: () => void;
 * }} props
 */
export function PastAssetsPickerSheet({
  visible,
  title = 'Past',
  items = [],
  selectedId = null,
  onSelect,
  onRequestClose,
}) {
  return (
    <BottomSheetModal
      allowBackdropClose
      fitContent={items.length <= 5}
      sheetHeightPercent={72}
      title={title}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {items.map((item) => (
        <ChoiceRow
          key={item.id}
          selected={item.id === selectedId}
          title={item.label}
          onPress={() => onSelect(item)}
        />
      ))}
    </BottomSheetModal>
  );
}
