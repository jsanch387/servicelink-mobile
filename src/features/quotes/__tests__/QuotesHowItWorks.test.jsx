import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { QuotesHowItWorks } from '../components/QuotesHowItWorks';
import {
  QUOTES_HOW_IT_WORKS_DISMISS_LABEL,
  QUOTES_HOW_IT_WORKS_LINK_LABEL,
  QUOTES_HOW_IT_WORKS_TITLE,
} from '../constants/quotesHowItWorksCopy';

describe('QuotesHowItWorks', () => {
  it('opens and closes the quotes explainer', async () => {
    renderWithProviders(<QuotesHowItWorks />);

    fireEvent.press(screen.getByRole('button', { name: QUOTES_HOW_IT_WORKS_LINK_LABEL }));
    expect(screen.getByText(QUOTES_HOW_IT_WORKS_TITLE)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: QUOTES_HOW_IT_WORKS_DISMISS_LABEL }));
    await waitFor(() => expect(screen.queryByText(QUOTES_HOW_IT_WORKS_TITLE)).toBeNull());
  });
});
