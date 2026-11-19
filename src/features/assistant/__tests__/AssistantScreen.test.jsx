import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { AssistantScreen } from '../screens/AssistantScreen';

describe('AssistantScreen', () => {
  it('shows what to do first and the ask field', () => {
    renderWithProviders(<AssistantScreen />);

    expect(screen.getByText("Here's what I'd do.")).toBeTruthy();
    expect(screen.getByText('3 people')).toBeTruthy();
    expect(screen.getByText("haven't left a review")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send a message' })).toBeTruthy();
    expect(screen.getByText('5 customers')).toBeTruthy();
    expect(screen.getByText('last booked 90+ days ago')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try to rebook' })).toBeTruthy();
    expect(screen.getByText('Ask about your business')).toBeTruthy();
    expect(screen.queryByText('Your assistant')).toBeNull();
  });
});
