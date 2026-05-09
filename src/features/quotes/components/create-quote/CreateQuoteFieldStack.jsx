import { View } from 'react-native';
import { CREATE_QUOTE_FIELD_GAP } from '../../constants/createQuoteWizard';

/**
 * Consistent vertical spacing between quote wizard inputs.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function CreateQuoteFieldStack({ children }) {
  return <View style={{ gap: CREATE_QUOTE_FIELD_GAP }}>{children}</View>;
}
