import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { OnboardingSlugStep } from '../OnboardingSlugStep';

describe('OnboardingSlugStep', () => {
  it('keeps the hyphen hint and drops the counter and example', () => {
    renderWithProviders(<OnboardingSlugStep value="my-shop" onChangeValue={jest.fn()} />);

    expect(screen.getByText('Use letters, numbers, and hyphens only.')).toBeTruthy();
    expect(screen.queryByText('Your path')).toBeNull();
    expect(screen.queryByText(/elite-detail/)).toBeNull();
    expect(screen.queryByText(/8\/\d+/)).toBeNull();
    expect(screen.queryByText(/my-shop\/\d+/)).toBeNull();
  });
});
