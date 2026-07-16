import { SurfaceTextField } from '../../../../components/ui';
import { QUOTE_NOTE_MAX } from '../../constants/createQuoteFieldLimits';

const FIELD_SHELL = { marginBottom: 0 };
const NOTE_INPUT_STYLE = { minHeight: 112, textAlignVertical: 'top' };

/**
 * Optional customer-facing note for a custom quote.
 *
 * @param {object} props
 * @param {string} props.note
 * @param {(text: string) => void} props.onNoteChange
 * @param {() => void} [props.onFocus]
 */
export function CreateQuoteStepNote({ note, onNoteChange, onFocus }) {
  return (
    <SurfaceTextField
      containerStyle={FIELD_SHELL}
      label="Business note (optional)"
      maxLength={QUOTE_NOTE_MAX}
      multiline
      onChangeText={onNoteChange}
      onFocus={onFocus}
      placeholder="Add details the customer should know…"
      style={NOTE_INPUT_STYLE}
      value={note}
    />
  );
}
